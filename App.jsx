import React, { useEffect, useMemo, useState } from "react";

const toBRL = (n) => (Number(n) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const slug = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-");

function parseCSV(text) {
  const lines = String(text).split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (!lines.length) throw new Error("CSV vazio");
  const header = lines[0].split(",").map((s) => s.trim().toLowerCase());
  const req = ["lider", "operacao", "faturamento", "maodeobra", "equipamentos", "ano", "mes"];
  if (!req.every((k) => header.includes(k))) throw new Error("Cabeçalhos obrigatórios: " + req.join(", "));
  const idx = Object.fromEntries(req.map((k) => [k, header.indexOf(k)]));
  const iTec = header.indexOf("tecnicos");
  const iAux = header.indexOf("auxiliares");
  return lines.slice(1).map((ln) => {
    const c = ln.split(",");
    const oper = (c[idx.operacao] || "").trim();
    return {
      lider: (c[idx.lider] || "").trim(),
      operacao: oper,
      faturamento: Number(c[idx.faturamento] || 0),
      maoDeObra: Number(c[idx.maodeobra] || 0),
      equipamentos: Number(c[idx.equipamentos] || 0),
      ano: Number(c[idx.ano] || 0),
      mes: Number(c[idx.mes] || 0),
      tecnicos: iTec >= 0 ? Number(c[iTec] || 0) : 0,
      auxiliares: iAux >= 0 ? Number(c[iAux] || 0) : 0,
      opId: `op-${slug(oper)}`,
    };
  });
}

function runParserTests() {
  try {
    const t1 = parseCSV("lider,operacao,faturamento,maodeobra,equipamentos,ano,mes\nA,OP,100,10,2,2025,9");
    console.assert(t1.length === 1 && t1[0].lider === "A", "Teste1 falhou");
    const t2 = parseCSV("lider,operacao,faturamento,maodeobra,equipamentos,ano,mes\r\nB,OP,200,20,3,2025,9");
    console.assert(t2.length === 1 && t2[0].lider === "B", "Teste2 falhou");
    const t3 = parseCSV("lider,operacao,faturamento,maodeobra,equipamentos,ano,mes,tecnicos,auxiliares\nC,OP,300,30,4,2025,9,1,2");
    console.assert(t3[0].tecnicos === 1 && t3[0].auxiliares === 2, "Teste3 falhou");
    const t4 = parseCSV("lider,operacao,faturamento,maodeobra,equipamentos,ano,mes\nD,OP,400,40,5,2025,9\n\n");
    console.assert(t4.length === 1 && t4[0].lider === "D", "Teste4 falhou");
    let erro = false; try { parseCSV("lider,operacao\nE,OP"); } catch { erro = true; }
    console.assert(erro, "Teste5 falhou");
    const t6 = parseCSV("lider,operacao,faturamento,maodeobra,equipamentos,ano,mes\nF,OP,500,50,6,2025,9");
    console.assert(t6[0].tecnicos === 0 && t6[0].auxiliares === 0, "Teste6 falhou");
    const t7 = parseCSV("lider,operacao,faturamento,maodeobra,equipamentos,ano,mes\nG,OP,, , ,2025,9");
    console.assert(t7[0].faturamento === 0 && t7[0].equipamentos === 0, "Teste7 falhou");
    console.log("Parser CSV: testes passaram ✅");
  } catch (e) {
    console.warn("Falha nos testes do parser:", e);
  }
}

function Icon({ path, children, ...p }) {
  return (
    <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...p}>
      {path ? <path d={path} /> : children}
    </svg>
  );
}
const IconUsers = (props) => (
  <Icon {...props}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </Icon>
);
const IconFactory = (props) => <Icon {...props} path="M3 21V9l7 4V9l7 4V9l4 2v10z" />;
const IconChevronDown = (props) => (
  <Icon {...props}>
    <polyline points="6 9 12 15 18 9" />
  </Icon>
);
const IconChevronRight = (props) => (
  <Icon {...props}>
    <polyline points="9 18 15 12 9 6" />
  </Icon>
);

function KPICard({ label, value, helper }) {
  return (
    <div className="card p-4">
      <div className="text-xs muted">{label}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
      {helper ? <div className="text-[11px] muted mt-1">{helper}</div> : null}
    </div>
  );
}

function LeadersRow({ org, expanded, onLeaderClick, onPick, leaderPicked }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <IconUsers />
        <div>
          <div className="text-sm font-medium leading-tight">{org.nome}</div>
          <div className="text-xs muted">{org.cargo}</div>
        </div>
      </div>
      <div className="h-3 w-[2px] bg-black/15 dark:bg-white/20 mx-4" />
      <div className="relative pt-2">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-black/15 dark:bg-white/20" />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {org.filhos?.map((leader) => {
            const isActiveLeader = leaderPicked === leader.nome;
            return (
              <div key={leader.id} className="relative">
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-[2px] h-2 bg-black/15 dark:bg-white/20" />
                <div className="card p-3">
                  <button
                    className={`w-full flex items-center gap-2 rounded-xl px-2 py-1.5 transition-colors ${
                      isActiveLeader
                        ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                        : "hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    }`}
                    onClick={() => onLeaderClick?.(leader)}
                  >
                    {expanded[leader.id] ? <IconChevronDown /> : <IconChevronRight />}
                    <IconUsers />
                    <div>
                      <div className="text-sm font-medium leading-tight">{leader.nome}</div>
                      <div className="text-xs muted">{leader.cargo || "Supervisor Regional"}</div>
                    </div>
                  </button>
                  {expanded[leader.id] && (
                    <div className="mt-2 space-y-1 relative pl-[18px]">
                      <div className="absolute left-[8px] top-0 bottom-0 w-[2px] bg-black/10 dark:bg-white/20" />
                      {leader.filhos?.map((op) => (
                        <button
                          key={op.id}
                          className={`relative w-full flex items-center gap-2 rounded-xl px-2 py-1.5 transition-colors ${
                            isActiveLeader
                              ? "bg-neutral-900/10 dark:bg-neutral-100/10"
                              : "hover:bg-neutral-100 dark:hover:bg-neutral-800"
                          }`}
                          onClick={() => onPick(op)}
                        >
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[10px] h-[2px] bg-black/10 dark:bg-white/20" />
                          <IconFactory />
                          <div>
                            <div className="text-sm font-medium leading-tight">{op.nome}</div>
                            <div className="text-xs muted">{op.cargo || "Operação"}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SimpleBarChart({ data, xKey, yKey, color = "currentColor", formatter = (v) => v }) {
  if (!data || data.length === 0) return null;
  const W = 800, H = 280, PAD = 32;
  const labels = data.map((d) => d[xKey]);
  const values = data.map((d) => Number(d[yKey]) || 0);
  const maxV = Math.max(1, ...values);
  const bw = (W - PAD * 2) / values.length;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-72">
      <line x1={PAD} y1={PAD} x2={PAD} y2={H - PAD} stroke="currentColor" opacity="0.2" />
      <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="currentColor" opacity="0.2" />
      {values.map((v, i) => {
        const h = (v / maxV) * (H - PAD * 2);
        const x = PAD + i * bw + bw * 0.15;
        const y = H - PAD - h;
        return (
          <g key={i}>
            <rect x={x} y={y} width={bw * 0.7} height={h} fill={color} opacity="0.6" />
            <title>{labels[i]} — {formatter(v)}</title>
          </g>
        );
      })}
      {labels.map((lab, i) => (
        <text key={i} x={PAD + i * bw + bw * 0.5} y={H - PAD + 18} fontSize="10" textAnchor="end" transform={`rotate(-20 ${PAD + i * bw + bw * 0.5},${H - PAD + 18})`}>
          {lab}
        </text>
      ))}
    </svg>
  );
}

function buildOrg(rows) {
  const leaders = Array.from(new Set(rows.map((r) => r.lider).filter(Boolean)));
  const filhos = leaders.map((l) => ({
    nome: l,
    cargo: "Supervisor Regional",
    id: slug(l),
    filhos: rows.filter((r) => r.lider === l).map((r) => ({ nome: r.operacao, cargo: "Operação", id: r.opId })),
  }));
  return { nome: "Paulo Amaral", cargo: "Gestor de Operações", id: "paulo", filhos };
}

const MOCK_ROWS = [
  { lider: "Clenildo Candeias", operacao: "BRF CD - Ap. Goiânia", faturamento: 109000, maoDeObra: 31000, equipamentos: 14, ano: 2025, mes: 9, opId: "op-apgyn", tecnicos: 1, auxiliares: 1 },
  { lider: "Jhonny Carlos", operacao: "BRF - Carambeí", faturamento: 185000, maoDeObra: 52000, equipamentos: 28, ano: 2025, mes: 9, opId: "op-carambei", tecnicos: 1, auxiliares: 0 },
  { lider: "Juvenil Oliveira", operacao: "BRF - Mineiros", faturamento: 158000, maoDeObra: 45000, equipamentos: 23, ano: 2025, mes: 9, opId: "op-mineiros", tecnicos: 2, auxiliares: 1 },
];

const VIEW_TABS = [
  { id: "tabela", label: "Tabela de operações" },
  { id: "faturamento", label: "Faturamento mensal" },
  { id: "mao", label: "Mão de obra mensal" },
];

export default function App() {
  const [rows, setRows] = useState(MOCK_ROWS);
  const [org, setOrg] = useState(buildOrg(MOCK_ROWS));
  const [expanded, setExpanded] = useState({});
  const [leaderPicked, setLeaderPicked] = useState(null);
  const [filters, setFilters] = useState({ ano: undefined, mes: undefined, busca: "" });
  const [modalCSV, setModalCSV] = useState(false);
  const [modalURL, setModalURL] = useState(false);
  const [csvText, setCsvText] = useState("");
  const [csvURL, setCsvURL] = useState("");
  const [tab, setTab] = useState("tabela");
  const leaderLabel = leaderPicked || "Todos os líderes";

  function applyParsedRows(parsed) {
    setRows(parsed);
    setOrg(buildOrg(parsed));
    const exp = {};
    parsed.forEach((r) => (exp[slug(r.lider)] = true));
    setExpanded(exp);
    setLeaderPicked(null);
    setTab("tabela");
  }

  useEffect(() => {
    try { runParserTests(); } catch {}
    const params = new URLSearchParams(window.location.search);
    const url = params.get("csv") || localStorage.getItem("csv_url");
    if (!url) return;
    fetch(url)
      .then((r) => r.text())
      .then((txt) => {
        const newRows = parseCSV(txt);
        applyParsedRows(newRows);
      })
      .catch(() => console.warn("Falha ao carregar CSV inicial"));
  }, []);

  useEffect(() => {
    if (!leaderPicked) return;
    if (!rows.some((r) => r.lider === leaderPicked)) {
      setLeaderPicked(null);
    }
  }, [rows, leaderPicked]);

  const filtered = useMemo(() => {
    let r = rows.slice();
    if (leaderPicked) r = r.filter((x) => x.lider === leaderPicked);
    if (filters.ano) r = r.filter((x) => x.ano === filters.ano);
    if (filters.mes) r = r.filter((x) => x.mes === filters.mes);
    if (filters.busca) r = r.filter((x) => x.operacao.toLowerCase().includes((filters.busca || "").toLowerCase()));
    return r;
  }, [rows, leaderPicked, filters]);

  const kpis = useMemo(() => {
    const totalFat = filtered.reduce((a, r) => a + (r.faturamento || 0), 0);
    const totalMO = filtered.reduce((a, r) => a + (r.maoDeObra || 0), 0);
    const totalEq = filtered.reduce((a, r) => a + (r.equipamentos || 0), 0);
    const totalTeam = filtered.reduce((a, r) => a + (r.tecnicos || 0) + (r.auxiliares || 0), 0);
    return { totalFat, totalMO, totalEq, totalTeam };
  }, [filtered]);

  const monthly = useMemo(() => {
    const map = new Map();
    filtered.forEach((r) => {
      const month = String(r.mes || 0).padStart(2, "0");
      const key = `${r.ano || 0}-${month}`;
      if (!map.has(key)) {
        map.set(key, { label: `${month}/${r.ano || ""}`, faturamento: 0, maoDeObra: 0 });
      }
      const item = map.get(key);
      item.faturamento += Number(r.faturamento) || 0;
      item.maoDeObra += Number(r.maoDeObra) || 0;
    });
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([, value]) => value);
  }, [filtered]);

  function onPick(op) {
    const row = rows.find((r) => r.opId === op.id || r.operacao === op.nome);
    if (row) {
      setLeaderPicked(row.lider);
      setExpanded((prev) => ({ ...prev, [slug(row.lider)]: true }));
      setTab("tabela");
    }
  }

  function handleLeaderClick(leader) {
    setExpanded((prev) => ({ ...prev, [leader.id]: !prev[leader.id] }));
    setLeaderPicked((current) => {
      const same = current === leader.nome;
      return same ? null : leader.nome;
    });
    setTab("tabela");
  }

  function importarCSV() {
    try {
      const parsed = parseCSV(csvText);
      applyParsedRows(parsed);
      setModalCSV(false);
      alert(`CSV importado: ${parsed.length} linhas`);
    } catch (e) {
      alert((e && e.message) || "Falha ao importar CSV");
    }
  }

  function conectarURL() {
    if (!csvURL) return alert("Informe a URL do CSV");
    fetch(csvURL)
      .then((r) => r.text())
      .then((txt) => {
        const parsed = parseCSV(txt);
        applyParsedRows(parsed);
        localStorage.setItem("csv_url", csvURL);
        setModalURL(false);
        alert(`Conectado! Linhas: ${parsed.length}`);
      })
      .catch(() => alert("Não foi possível carregar a URL. Verifique se o CSV é público."));
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900 text-neutral-900 dark:text-neutral-100 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-start md:items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold">Organograma Interativo</h1>
            <p className="text-sm muted">
              Clique em um líder para ver operações, faturamento, custo de mão de obra e <b>quantidade de equipe</b>.
              Qualquer pessoa com o link pode visualizar.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button className="btn" onClick={() => setModalURL(true)}>Conectar CSV (URL)</button>
            <button className="btn" onClick={() => setModalCSV(true)}>Importar CSV</button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5">
            <div className="card p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="text-sm muted">Organograma</div>
              </div>
              <div className="border-t border-neutral-200 dark:border-neutral-800" />
              <LeadersRow
                org={org}
                expanded={expanded}
                onLeaderClick={handleLeaderClick}
                onPick={onPick}
                leaderPicked={leaderPicked}
              />
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="card p-4 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div>
                    <div className="text-sm muted">Líder selecionado</div>
                    <div className="text-lg font-semibold">{leaderLabel}</div>
                  </div>
                  {leaderPicked ? (
                    <button
                      className="btn text-xs h-8"
                      onClick={() => {
                        setLeaderPicked(null);
                        setTab("tabela");
                      }}
                    >
                      Limpar seleção
                    </button>
                  ) : null}
                </div>
                <span className="badge">{filtered.length} operações</span>
              </div>

              <div className="flex flex-wrap items-end gap-3">
                <div className="w-28">
                  <div className="text-xs mb-1">Ano</div>
                  <input type="number" className="input" value={filters.ano ?? ""} placeholder="2025" onChange={(e) => setFilters((f) => ({ ...f, ano: e.target.value ? Number(e.target.value) : undefined }))} />
                </div>
                <div className="w-28">
                  <div className="text-xs mb-1">Mês</div>
                  <input type="number" className="input" value={filters.mes ?? ""} placeholder="9" onChange={(e) => setFilters((f) => ({ ...f, mes: e.target.value ? Number(e.target.value) : undefined }))} />
                </div>
                <div className="flex-1 min-w-[140px]">
                  <div className="text-xs mb-1">Busca (operação)</div>
                  <input className="input" value={filters.busca ?? ""} placeholder="Ex.: Ap. Goiânia" onChange={(e) => setFilters((f) => ({ ...f, busca: e.target.value || undefined }))} />
                </div>
                <button className="btn" onClick={() => setFilters({})}>Limpar</button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <KPICard label="Faturamento (total)" value={toBRL(kpis.totalFat)} />
                <KPICard label="Mão de Obra (total)" value={toBRL(kpis.totalMO)} />
                <KPICard label="Equipamentos (soma)" value={kpis.totalEq} />
                <KPICard label="Equipe (total pessoas)" value={kpis.totalTeam} />
              </div>

              <div className="flex flex-wrap gap-2">
                {VIEW_TABS.map((t) => (
                  <button
                    key={t.id}
                    className={`btn text-xs ${
                      tab === t.id
                        ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                        : "hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    }`}
                    onClick={() => setTab(t.id)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {tab === "tabela" && (
                <div className="overflow-auto rounded-xl border">
                  <table className="w-full text-sm">
                    <thead className="bg-neutral-50 dark:bg-neutral-800">
                      <tr className="text-left">
                        <th className="p-3">Operação</th>
                        <th className="p-3">Faturamento</th>
                        <th className="p-3">Mão de Obra (R$)</th>
                        <th className="p-3">Equipamentos</th>
                        <th className="p-3">Equipe (T/A)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((r) => (
                        <tr key={r.opId} className="border-t">
                          <td className="p-3 font-medium">{r.operacao}</td>
                          <td className="p-3">{toBRL(r.faturamento)}</td>
                          <td className="p-3">{toBRL(r.maoDeObra)}</td>
                          <td className="p-3">{r.equipamentos}</td>
                          <td className="p-3">{r.tecnicos || 0} T / {r.auxiliares || 0} A</td>
                        </tr>
                      ))}
                      {filtered.length === 0 && (
                        <tr>
                          <td className="p-6 text-center muted" colSpan={5}>
                            Nenhuma operação encontrada com os filtros atuais.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {tab === "faturamento" && (
                <div className="rounded-xl border p-4">
                  {monthly.length ? (
                    <SimpleBarChart data={monthly} xKey="label" yKey="faturamento" formatter={toBRL} color="#1d4ed8" />
                  ) : (
                    <div className="text-sm muted text-center">Sem dados de faturamento para o filtro atual.</div>
                  )}
                </div>
              )}

              {tab === "mao" && (
                <div className="rounded-xl border p-4">
                  {monthly.length ? (
                    <SimpleBarChart data={monthly} xKey="label" yKey="maoDeObra" formatter={toBRL} color="#047857" />
                  ) : (
                    <div className="text-sm muted text-center">Sem dados de mão de obra para o filtro atual.</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {modalURL && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="max-w-2xl w-full card">
            <div className="p-6 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Conectar via URL (CSV público)</h2>
                <button className="btn" onClick={() => setModalURL(false)}>Fechar</button>
              </div>
              <p className="text-sm muted">Cole a URL do CSV (ex.: Google Sheets publicado):</p>
              <input className="input" value={csvURL} onChange={(e) => setCsvURL(e.target.value)} placeholder="https://docs.google.com/spreadsheets/.../export?format=csv" />
              <div className="flex justify-end gap-2">
                <button className="btn" onClick={() => setCsvURL("")}>Limpar</button>
                <button className="btn-primary" onClick={conectarURL}>Conectar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {modalCSV && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="max-w-3xl w-full card">
            <div className="p-6 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Importar CSV (colunas)</h2>
                <button className="btn" onClick={() => setModalCSV(false)}>Fechar</button>
              </div>
              <p className="text-sm muted">Obrigatórias: <code>Lider,Operacao,Faturamento,MaoDeObra,Equipamentos,Ano,Mes</code> • Opcionais: <code>Tecnicos,Auxiliares</code></p>
              <textarea className="input h-56 font-mono text-xs" value={csvText} onChange={(e) => setCsvText(e.target.value)} placeholder={`Lider,Operacao,Faturamento,MaoDeObra,Equipamentos,Ano,Mes,Tecnicos,Auxiliares\nJhonny Carlos,BRF - Carambeí,185000,52000,28,2025,9,1,1\nClenildo Candeias,BRF CD - Ap. Goiânia,109000,31000,14,2025,9,1,1`} />
              <div className="flex justify-end gap-2">
                <button className="btn" onClick={() => setCsvText("")}>Limpar</button>
                <button className="btn-primary" onClick={importarCSV}>Importar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
