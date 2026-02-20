"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { Check, Copy, ChevronRight, Terminal, FileCode, Globe, Zap } from "lucide-react";
import { SiReact, SiReactrouter, SiVite } from "react-icons/si";
import { FaAngular, FaHtml5, FaVuejs } from "react-icons/fa";
import { RiNextjsFill } from "react-icons/ri";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { toast } from "sonner";

type Framework = "html" | "react" | "vite" | "react-router" | "next" | "angular" | "vue";

interface Step {
    title: string;
    description?: string;
    code?: string;
    lang?: string;
    note?: string;
}

const FRAMEWORKS: {
    id: Framework;
    label: string;
    icon: React.ReactNode;
    brandColor: string;
    brandBg: string;
}[] = [
        { id: "react", label: "React", icon: <SiReact />, brandColor: "#61DAFB", brandBg: "rgba(97,218,251,0.10)" },
        { id: "next", label: "Next.js", icon: <RiNextjsFill />, brandColor: "#FFFFFF", brandBg: "rgba(255,255,255,0.08)" },
        { id: "html", label: "HTML", icon: <FaHtml5 />, brandColor: "#E44D26", brandBg: "rgba(228,77,38,0.10)" },
        { id: "vite", label: "Vite", icon: <SiVite />, brandColor: "#A78BFA", brandBg: "rgba(167,139,250,0.10)" },
        { id: "react-router", label: "React Router", icon: <SiReactrouter />, brandColor: "#F44250", brandBg: "rgba(244,66,80,0.10)" },
        { id: "angular", label: "Angular", icon: <FaAngular />, brandColor: "#DD0031", brandBg: "rgba(221,0,49,0.10)" },
        { id: "vue", label: "Vue", icon: <FaVuejs />, brandColor: "#42B883", brandBg: "rgba(66,184,131,0.10)" },
    ];

function getSteps(fw: Framework, appKey: string): Step[] {
    const initSnippet = `SupportAI.init({\n  appKey: "${appKey}",\n  position: "bottom-right"\n});`;
    const scriptTags = `<script src="https://supportai-widget.vercel.app/widget-loader.js"></script>\n<script>\n  ${initSnippet}\n</script>`;

    switch (fw) {
        case "html":
            return [
                {
                    title: "Add scripts to your HTML file",
                    description: "Paste the following snippet just before the closing </body> tag in your HTML file.",
                    code: scriptTags,
                    lang: "html",
                },
                {
                    title: "That's it!",
                    description: "Reload your page — the support widget will appear in the bottom-right corner. No build step required.",
                    note: "Make sure your domain is listed in the allowed domains for this app, otherwise the widget will be blocked.",
                },
            ];

        case "react":
            return [
                {
                    title: "Create a SupportWidget component",
                    description: "Create a new file src/components/SupportWidget.tsx (or .jsx) and paste the code below.",
                    code: `import { useEffect } from "react";\n\nexport default function SupportWidget() {\n  useEffect(() => {\n    // Load script once\n    if (document.getElementById("supportai-script")) return;\n\n    const script = document.createElement("script");\n    script.id = "supportai-script";\n    script.src = "https://supportai-widget.vercel.app/widget-loader.js";\n    script.async = true;\n    script.onload = () => {\n      (window as any).SupportAI?.init({\n        appKey: "${appKey}",\n        position: "bottom-right",\n      });\n    };\n    document.body.appendChild(script);\n\n    return () => {\n      document.getElementById("supportai-script")?.remove();\n    };\n  }, []);\n\n  return null;\n}`,
                    lang: "tsx",
                },
                {
                    title: "Mount it in your App root",
                    description: "Import and render <SupportWidget /> once at the top level — typically App.tsx or main.tsx.",
                    code: `import SupportWidget from "./components/SupportWidget";\n\nexport default function App() {\n  return (\n    <>\n      <SupportWidget />\n      {/* rest of your app */}\n    </>\n  );\n}`,
                    lang: "tsx",
                },
                {
                    title: "Verify the widget loads",
                    description: "Run your dev server and open your app. The support bubble should appear in the bottom-right corner.",
                    note: "The component returns null — it only injects the script. There's nothing to style.",
                },
            ];

        case "vite":
            return [
                {
                    title: "Add scripts to index.html",
                    description: "Open the root index.html file (in your project root, not /public). Paste before </body>.",
                    code: scriptTags,
                    lang: "html",
                    note: "Vite serves index.html from the project root, not from /public.",
                },
                {
                    title: "Alternatively — load via main.ts",
                    description: "If you prefer JS-only loading, add this to your src/main.ts entry point.",
                    code: `const script = document.createElement("script");\nscript.src = "https://supportai-widget.vercel.app/widget-loader.js";\nscript.async = true;\nscript.onload = () => {\n  (window as any).SupportAI?.init({\n    appKey: "${appKey}",\n    position: "bottom-right",\n  });\n};\ndocument.body.appendChild(script);`,
                    lang: "ts",
                },
                {
                    title: "Start your dev server",
                    description: "Run `vite` or `npm run dev` — the widget will appear after the script loads.",
                },
            ];

        case "react-router":
            return [
                {
                    title: "Create a SupportWidget component",
                    description: "Create src/components/SupportWidget.tsx — same as the standalone React component.",
                    code: `import { useEffect } from "react";\n\nexport default function SupportWidget() {\n  useEffect(() => {\n    if (document.getElementById("supportai-script")) return;\n\n    const script = document.createElement("script");\n    script.id = "supportai-script";\n    script.src = "https://supportai-widget.vercel.app/widget-loader.js";\n    script.async = true;\n    script.onload = () => {\n      (window as any).SupportAI?.init({\n        appKey: "${appKey}",\n        position: "bottom-right",\n      });\n    };\n    document.body.appendChild(script);\n  }, []);\n\n  return null;\n}`,
                    lang: "tsx",
                },
                {
                    title: "Add to your root layout/route",
                    description: "Place <SupportWidget /> inside your root layout component so it persists across all routes without remounting.",
                    code: `import { Outlet } from "react-router-dom";\nimport SupportWidget from "./components/SupportWidget";\n\nexport default function RootLayout() {\n  return (\n    <>\n      <SupportWidget />\n      <Outlet />\n    </>\n  );\n}`,
                    lang: "tsx",
                },
                {
                    title: "Register the layout in your router",
                    description: "Make sure RootLayout wraps all your routes so the widget loads once and persists during navigation.",
                    code: `import { createBrowserRouter, RouterProvider } from "react-router-dom";\nimport RootLayout from "./layouts/RootLayout";\nimport Home from "./pages/Home";\n\nconst router = createBrowserRouter([\n  {\n    path: "/",\n    element: <RootLayout />,\n    children: [\n      { index: true, element: <Home /> },\n      // add more routes here\n    ],\n  },\n]);\n\nexport default function App() {\n  return <RouterProvider router={router} />;\n}`,
                    lang: "tsx",
                    note: "Using a root layout prevents the widget from being destroyed and recreated on route changes.",
                },
            ];

        case "next":
            return [
                {
                    title: "Create a client component for the widget",
                    description: "Create components/SupportWidget.tsx. It must be a client component because it uses useEffect and accesses window.",
                    code: `"use client";\n\nimport { useEffect } from "react";\n\nexport default function SupportWidget() {\n  useEffect(() => {\n    if (document.getElementById("supportai-script")) return;\n\n    const script = document.createElement("script");\n    script.id = "supportai-script";\n    script.src = "https://supportai-widget.vercel.app/widget-loader.js";\n    script.async = true;\n    script.onload = () => {\n      (window as any).SupportAI?.init({\n        appKey: "${appKey}",\n        position: "bottom-right",\n      });\n    };\n    document.body.appendChild(script);\n  }, []);\n\n  return null;\n}`,
                    lang: "tsx",
                },
                {
                    title: "Add to your root layout",
                    description: "Open app/layout.tsx (App Router) and mount the component inside <body>. It only needs to render once.",
                    code: `import SupportWidget from "@/components/SupportWidget";\n\nexport default function RootLayout({\n  children,\n}: {\n  children: React.ReactNode;\n}) {\n  return (\n    <html lang="en">\n      <body>\n        {children}\n        <SupportWidget />\n      </body>\n    </html>\n  );\n}`,
                    lang: "tsx",
                    note: "Keep the layout itself a Server Component — only SupportWidget needs 'use client'.",
                },
                {
                    title: "For Pages Router (older Next.js)",
                    description: "If you're on the Pages Router, add the component to _app.tsx instead.",
                    code: `import type { AppProps } from "next/app";\nimport SupportWidget from "../components/SupportWidget";\n\nexport default function MyApp({ Component, pageProps }: AppProps) {\n  return (\n    <>\n      <Component {...pageProps} />\n      <SupportWidget />\n    </>\n  );\n}`,
                    lang: "tsx",
                },
                {
                    title: "Deploy and verify",
                    description: "Run npm run dev. Open your app — the widget should appear on all pages without flashing or reloading between navigations.",
                },
            ];

        case "angular":
            return [
                {
                    title: "Add scripts to angular.json",
                    description: 'Open angular.json and add the widget script URL to the "scripts" array under your build target.',
                    code: `"scripts": [\n  "https://supportai-widget.vercel.app/widget-loader.js"\n]`,
                    lang: "json",
                    note: "Restart ng serve after editing angular.json for the change to take effect.",
                },
                {
                    title: "Create a SupportWidget component",
                    description: "Generate a new Angular component and initialise the widget in ngOnInit.",
                    code: `ng generate component support-widget`,
                    lang: "bash",
                },
                {
                    title: "Implement the component",
                    description: "Open support-widget.component.ts and add the init call.",
                    code: `import { Component, OnInit } from "@angular/core";\n\ndeclare const SupportAI: any;\n\n@Component({\n  selector: "app-support-widget",\n  template: "",\n})\nexport class SupportWidgetComponent implements OnInit {\n  ngOnInit(): void {\n    if (typeof SupportAI !== "undefined") {\n      SupportAI.init({\n        appKey: "${appKey}",\n        position: "bottom-right",\n      });\n    }\n  }\n}`,
                    lang: "ts",
                },
                {
                    title: "Add to AppComponent template",
                    description: "Open app.component.html and add the selector once.",
                    code: `<app-support-widget></app-support-widget>\n<router-outlet></router-outlet>`,
                    lang: "html",
                },
            ];

        case "vue":
            return [
                {
                    title: "Create a SupportWidget component",
                    description: "Create src/components/SupportWidget.vue.",
                    code: `<template>\n  <div></div>\n</template>\n\n<script setup lang="ts">\nimport { onMounted } from "vue";\n\nonMounted(() => {\n  if (document.getElementById("supportai-script")) return;\n\n  const script = document.createElement("script");\n  script.id = "supportai-script";\n  script.src = "https://supportai-widget.vercel.app/widget-loader.js";\n  script.async = true;\n  script.onload = () => {\n    (window as any).SupportAI?.init({\n      appKey: "${appKey}",\n      position: "bottom-right",\n    });\n  };\n  document.body.appendChild(script);\n});\n</script>`,
                    lang: "vue",
                },
                {
                    title: "Register in App.vue",
                    description: "Import and use the component in your App.vue root template.",
                    code: `<template>\n  <SupportWidget />\n  <RouterView />\n</template>\n\n<script setup lang="ts">\nimport SupportWidget from "./components/SupportWidget.vue";\n</script>`,
                    lang: "vue",
                    note: "Placing it in App.vue ensures the widget loads once and persists across all Vue Router navigations.",
                },
                {
                    title: "Run your dev server",
                    description: "Run `npm run dev` — the widget will appear in the bottom-right of your app.",
                },
            ];
    }
}

function TableOfContents({
    steps,
    activeIdx,
    onSelect,
}: {
    steps: Step[];
    activeIdx: number;
    onSelect: (i: number) => void;
}) {
    return (
        <nav className="space-y-1">
            {steps.map((s, i) => (
                <button
                    key={i}
                    onClick={() => {
                        onSelect(i);
                        document.getElementById(`step-${i}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }}
                    className={`w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all ${activeIdx === i
                        ? "bg-white/10 text-white"
                        : "text-white/40 hover:text-white/60"
                        }`}
                >
                    <span
                        className={`shrink-0 h-4.5 w-4.5 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all ${activeIdx === i
                            ? "border-white/40 bg-white/20 text-white"
                            : "border-white/15 text-white/30"
                            }`}
                    >
                        {i + 1}
                    </span>
                    <span className="truncate leading-snug">{s.title}</span>
                </button>
            ))}
        </nav>
    );
}

function CodeBlock({ code, lang }: { code: string; lang?: string }) {
    const [copied, setCopied] = useState(false);

    function copy() {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
    }

    return (
        <div className="relative rounded-xl overflow-hidden border border-white/20 bg-[#090d13]">
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-white/2">
                <span className="text-[10px] font-mono text-white/25 uppercase tracking-widest">
                    {lang || "code"}
                </span>
                <button
                    onClick={copy}
                    className="flex items-center gap-1.5 text-[11px] text-white/50 hover:text-white/70 transition-colors"
                >
                    {copied ? (
                        <>
                            <Check className="h-3 w-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied!</span>
                        </>
                    ) : (
                        <>
                            <Copy className="h-3 w-3" />
                            Copy
                        </>
                    )}
                </button>
            </div>
            <pre className="px-2 text-sm text-white/80 overflow-x-auto leading-relaxed font-mono whitespace-pre">
                <SyntaxHighlighter
                    language="typescript"
                    style={vscDarkPlus}
                    className="h-full cursor-auto no-scrollbar"
                    customStyle={{
                        height: '100%',
                        borderRadius: '0.75rem',
                    }}
                    wrapLongLines={true}
                    showLineNumbers={true}
                    lineNumberStyle={{
                        color: '#6B7280',
                        paddingRight: '1rem',
                        marginRight: '1rem',
                        borderRight: '1px solid #374151',
                        minWidth: '2.5rem'
                    }}
                >
                    {code}
                </SyntaxHighlighter>
            </pre>
        </div>
    );
}

function StepCard({ step, index, total }: { step: Step; index: number; total: number }) {
    return (
        <div className="flex gap-5">
            <div className="flex flex-col items-center">
                <div className="h-7 w-7 shrink-0 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-xs font-bold text-white/70">
                    {index + 1}
                </div>
                {index < total - 1 && <div className="w-px flex-1 my-3 bg-white/20" />}
            </div>

            <div className="flex-1 pb-10 space-y-3 min-w-0">
                <div className="pt-0.5">
                    <h3 className="text-sm font-semibold text-white leading-snug">{step.title}</h3>
                    {step.description && (
                        <p className="text-sm text-white/50 mt-1 leading-relaxed">{step.description}</p>
                    )}
                </div>

                {step.code && <CodeBlock code={step.code} lang={step.lang} />}

                {step.note && (
                    <div className="flex gap-2.5 rounded-xl bg-amber-400/6 border border-amber-400/15 px-3.5 py-2.5">
                        <span className="text-amber-400 text-sm shrink-0">⚠</span>
                        <p className="text-xs text-amber-300/80 leading-relaxed">{step.note}</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function SetupPage() {
    const params = useParams<{ appId: string }>();
    const appId = params?.appId ?? "";

    const [appKey] = useState<string>(() => {
        if (typeof window !== "undefined") {
            return new URLSearchParams(window.location.search).get("appKey") ?? appId;
        }
        return appId;
    });

    const [fw, setFw] = useState<Framework>("react");
    const [activeStep, setActiveStep] = useState(0);

    const steps = getSteps(fw, appKey);

    function selectFramework(f: Framework) {
        setFw(f);
        setActiveStep(0);
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20">
            {/* ── Header ──────────────────────────────────────────────────── */}
            <div className="space-y-1">
                <div className="inline-flex items-center gap-2 text-xs text-white/40 mb-3">
                    <a href="/dashboard/apps" className="hover:text-white/70 transition-colors">
                        Apps
                    </a>
                    <ChevronRight className="h-3 w-3" />
                    <span className="text-white/60">Setup</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-linear-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                        <Zap className="h-4.5 w-4.5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white tracking-tight">Widget Setup</h1>
                        <p className="text-sm text-white/45">
                            Follow the steps below to embed your support widget
                        </p>
                    </div>
                </div>
            </div>

            {/* ── appKey callout ───────────────────────────────────────────── */}
            <div className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white/3 px-5 py-3.5">
                <FileCode className="h-4 w-4 text-white/30 shrink-0" />
                <div className="text-xs text-white/40">Your App Key:</div>
                <code className="flex-1 font-mono text-sm text-white/80 min-w-0 truncate">{appKey}</code>
                <button
                    onClick={() => {
                        navigator.clipboard.writeText(appKey)

                        toast.success("AppKey Copied!")
                    }}
                    className="shrink-0 flex items-center gap-1.5 text-xs text-white/50 hover:text-white/70 transition-colors"
                >
                    <Copy className="h-3.5 w-3.5" /> Copy
                </button>
            </div>

            {/* ── Framework selector ──────────────────────────────────────── */}
            <div className="space-y-3">
                <div className="text-xs font-medium text-white/40 uppercase tracking-widest">
                    Select your framework
                </div>

                <div className="flex flex-wrap gap-3">
                    {FRAMEWORKS.map((f) => {
                        const isActive = fw === f.id;
                        return (
                            <button
                                key={f.id}
                                onClick={() => selectFramework(f.id)}
                                style={
                                    isActive
                                        ? {
                                            borderColor: f.brandColor,
                                            background: f.brandBg,
                                            color: f.brandColor,
                                        }
                                        : undefined
                                }
                                className={`flex items-center gap-3 px-5 py-1.5 rounded-xl border text-base font-medium transition-all duration-150 ${isActive
                                    ? "shadow-sm"
                                    : "bg-white/4 border-white/15 text-white/50 hover:text-white/80 hover:bg-white/[0.07] hover:border-white/[0.14]"
                                    }`}
                            >
                                <span
                                    className="flex items-center text-xl leading-none transition-colors duration-150"
                                    style={{ color: isActive ? f.brandColor : "rgba(255,255,255,0.35)" }}
                                >
                                    {f.icon}
                                </span>
                                {f.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ── Two-column layout: TOC + Steps ──────────────────────────── */}
            <div className="grid grid-cols-[200px_1fr] gap-8 items-start">
                {/* Sticky TOC */}
                <div className="sticky top-6 rounded-2xl border border-white/20 bg-white/2 p-3">
                    <div className="text-[10px] text-white/50 uppercase tracking-widest px-3 pb-2">
                        Contents
                    </div>

                    <TableOfContents steps={steps} activeIdx={activeStep} onSelect={setActiveStep} />

                    <div className="pt-2 border-t border-white/20 mt-2 space-y-0.5">
                        <a
                            href={`/dashboard/apps/${appId}/edit`}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-white/60 hover:text-white/80 transition-colors"
                        >
                            <Terminal className="h-3.5 w-3.5" />
                            App settings
                        </a>
                        <a
                            href="/dashboard/apps"
                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-white/60 hover:text-white/80 transition-colors"
                        >
                            <Globe className="h-3.5 w-3.5" />
                            All apps
                        </a>
                    </div>
                </div>

                {/* Steps */}
                <div className="space-y-0 min-w-0">
                    {steps.map((s, i) => (
                        <div key={i} id={`step-${i}`} onClick={() => setActiveStep(i)} className="cursor-pointer scroll-mt-6">
                            <StepCard step={s} index={i} total={steps.length} />
                        </div>
                    ))}

                    {/* Done card */}
                    <div className="ml-12 rounded-2xl border border-emerald-500/20 bg-emerald-500/6 px-5 py-4 flex items-center gap-4">
                        <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                            <Check className="h-4 w-4 text-emerald-400" />
                        </div>
                        <div>
                            <div className="text-sm font-semibold text-emerald-300">You're all set!</div>
                            <div className="text-xs text-white/40 mt-0.5">
                                Your support widget is ready. Visit{" "}
                                <a
                                    href={`/dashboard/apps/${appId}/edit`}
                                    className="text-white/60 underline underline-offset-2 hover:text-white/80"
                                >
                                    app settings
                                </a>{" "}
                                to customise the appearance and knowledge base.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}