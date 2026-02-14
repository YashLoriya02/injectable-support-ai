"use client"

import LogoutButton from "@/components/LogoutButton";
import { useSession } from "next-auth/react";

export default function HomePage() {
  const { data } = useSession()

  const isAuthed = data?.user?.mongoId

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b border-white/10 bg-black/60 backdrop-blur">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center font-extrabold">

            </div>
            <div className="leading-tight">
              <div className="font-extrabold tracking-tight">SupportAI</div>
            </div>
          </a>

          <nav className="flex items-center gap-2">
            <a
              href="#features"
              className="hidden sm:inline-flex px-3 py-2 rounded-xl text-sm text-white/70 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10"
            >
              Features
            </a>
            <a
              href="#how"
              className="hidden sm:inline-flex px-3 py-2 rounded-xl text-sm text-white/70 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10"
            >
              How it works
            </a>
            <a
              href="#security"
              className="hidden sm:inline-flex px-3 py-2 rounded-xl text-sm text-white/70 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10"
            >
              Security
            </a>

            {isAuthed ? (
              <LogoutButton />
            ) : (
              <>
                <a
                  href="/login"
                  className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm font-semibold"
                >
                  Login
                </a>
                <a
                  href="/signup"
                  className="px-4 py-2 rounded-xl bg-white text-black font-bold text-sm"
                >
                  Create account
                </a>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-72 w-225 rounded-full bg-purple-500/10 blur-3xl" />
          <div className="absolute top-64 right-10 h-56 w-56 rounded-full bg-white/5 blur-2xl" />
        </div>

        <div className="mx-auto max-w-7xl px-6 py-10 relative">
          <div className="grid lg:grid-cols-2 gap-24 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                Install in minutes • Works with any frontend
              </div>

              <h1 className="mt-4 text-4xl sm:text-5xl font-extrabold tracking-tight leading-[1.05]">
                A support chat assistant you can{" "}
                <span className="text-white/90">inject into any website</span>
              </h1>

              <p className="mt-4 text-base sm:text-lg text-white/70 leading-relaxed">
                Drop a single script, get a bottom-right support widget, and let users
                ask questions. Your answers are grounded in your own Markdown docs
                and controlled from your dashboard.
              </p>

              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                {isAuthed ? (
                  <>
                    <a
                      href="/dashboard/apps/new"
                      className="px-5 py-3 rounded-2xl bg-white text-black font-bold text-sm"
                    >
                      Create your first app
                    </a>
                    <a
                      href="/dashboard"
                      className="px-5 py-3 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 font-semibold text-sm"
                    >
                      Open dashboard
                    </a>
                  </>
                ) : (
                  <>
                    <a
                      href="/signup"
                      className="px-5 py-3 rounded-2xl bg-white/90 text-black/80 font-bold text-sm"
                    >
                      Start free
                    </a>
                    <a
                      href="/login"
                      className="px-7 py-3 rounded-2xl border border-white/20 bg-white/5 hover:bg-white/10 font-semibold text-sm"
                    >
                      Login
                    </a>
                  </>
                )}
              </div>

              <div className="mt-6 grid grid-cols-3 gap-3 text-xs text-white/60">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <div className="font-bold text-white">1 Script</div>
                  <div className="mt-1">Inject anywhere</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <div className="font-bold text-white">Domain Locked</div>
                  <div className="mt-1">No key misuse</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <div className="font-bold text-white">Doc-grounded</div>
                  <div className="mt-1">Markdown KB</div>
                </div>
              </div>
            </div>

            {/* Right preview card */}
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="rounded-2xl border border-white/10 bg-black/40 overflow-hidden">
                <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold">Support</div>
                    <div className="text-xs text-white/60">Ask anything about your product</div>
                  </div>
                  <div className="h-9 w-9 rounded-xl border border-white/10 bg-white/5" />
                </div>
                <div className="p-4 space-y-3">
                  <div className="max-w-[85%] w-fit rounded-2xl bg-white/10 px-3 py-2 text-sm text-white/90">
                    👋 Hey! I can answer using your docs.
                  </div>
                  <div className="ml-auto w-fit max-w-[75%] rounded-2xl bg-purple-500/70 px-3 py-2 text-sm">
                    How do I install it in React?
                  </div>
                  <div className="max-w-[85%] rounded-2xl bg-white/10 px-3 py-2 text-sm text-white/90">
                    Add the script tag + call <span className="font-mono">SupportAI.init</span>. You’re done.
                  </div>
                </div>
                <div className="p-3 border-t border-white/10">
                  <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-2">
                    <div className="flex-1 h-10 rounded-xl bg-black/30 border border-white/10" />
                    <div className="h-9 w-20 rounded-xl bg-white text-black font-bold text-sm flex items-center justify-center">
                      Send
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 text-xs text-white/60">
                This is just the embedded iframe UI. You control theme, copy, domains, and docs from the dashboard.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-14">
        <div className="flex items-end justify-between gap-6">
          <div>
            <div className="text-2xl font-extrabold">Built for real support, not demos</div>
            <div className="text-white/60 mt-2">
              Lightweight embed + dashboard controlled config + Markdown knowledge base.
            </div>
          </div>
        </div>

        <div className="mt-8 grid md:grid-cols-3 gap-4">
          {[
            {
              title: "Universal embed",
              desc: "Works with Next.js, React, Vue, Angular, plain HTML… anywhere you can load a script.",
            },
            {
              title: "Dashboard customizations",
              desc: "Theme, launcher icon, labels, borders, layout options — all driven from server config.",
            },
            {
              title: "Markdown knowledge base",
              desc: "Upload product docs (.md). The assistant answers based on your content (grounded responses).",
            },
            {
              title: "Domain security",
              desc: "Lock each appKey to allowed domains so the widget can’t be stolen and used elsewhere.",
            },
            {
              title: "Conversations + logs",
              desc: "Save conversations for QA, improvements, and future analytics in dashboard.",
            },
            {
              title: "Streaming replies",
              desc: "Fast UI with token streaming so it feels like a real assistant, not a slow chatbot.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-white/10 bg-white/5 p-4"
            >
              <div className="font-bold">{f.title}</div>
              <div className="mt-2 text-sm text-white/65 leading-relaxed">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-6xl px-6 py-14">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="text-2xl font-extrabold">How it works</div>
          <div className="text-white/60 mt-2">
            A clean pipeline: App creation → Script embed → Config fetch → Chat streaming.
          </div>

          <div className="mt-6 grid md:grid-cols-4 gap-4">
            {[
              { step: "1", title: "Create App", desc: "Set app name + allowed domains. Get appKey." },
              { step: "2", title: "Embed Script", desc: "Drop script tag + init call in any site." },
              { step: "3", title: "Upload Docs", desc: "Add Markdown docs that represent your product." },
              { step: "4", title: "Chat + Improve", desc: "See logs, refine docs, and tune prompts later." },
            ].map((x) => (
              <div
                key={x.step}
                className="rounded-2xl border border-white/10 bg-black/30 p-4"
              >
                <div className="text-xs text-white/60">Step {x.step}</div>
                <div className="mt-1 font-bold">{x.title}</div>
                <div className="mt-2 text-sm text-white/65">{x.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security */}
      <section id="security" className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="text-2xl font-extrabold">Security by default</div>
            <div className="mt-2 text-white/60">
              Your widget should not be copy-pasted and abused.
            </div>

            <ul className="mt-5 space-y-3 text-sm text-white/70">
              <li className="flex gap-2">
                <span className="text-green-400">✓</span>
                Domain allowlist: requests must come from approved hostnames.
              </li>
              <li className="flex gap-2">
                <span className="text-green-400">✓</span>
                Server-driven config: UI customizations come from API, not hardcoded.
              </li>
              <li className="flex gap-2">
                <span className="text-green-400">✓</span>
                Conversation storage: audit support quality and build analytics.
              </li>
            </ul>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="text-2xl font-extrabold">Docs-first answers</div>
            <div className="mt-2 text-white/60">
              You control the assistant by maintaining Markdown — not by rewriting code.
            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm">
              <div className="text-white/70">Example docs</div>
              <div className="mt-2 font-mono text-xs text-white/70 leading-relaxed">
                # Pricing{"\n"}
                # Refund Policy{"\n"}
                # Setup Guide{"\n"}
                # Troubleshooting{"\n"}
                # Security
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="text-xl font-extrabold">
              Ship a support assistant in one afternoon
            </div>
            <div className="text-sm text-white/60 mt-1">
              Start with config + docs + embed. Add AI model routing later.
            </div>
          </div>

          {isAuthed ? (
            <a
              href="/dashboard/apps/new"
              className="px-5 py-3 rounded-2xl bg-white text-black font-extrabold text-sm"
            >
              Create app
            </a>
          ) : (
            <div className="flex gap-3">
              <a
                href="/login"
                className="px-5 py-3 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 font-semibold text-sm"
              >
                Login
              </a>
              <a
                href="/signup"
                className="px-5 py-3 rounded-2xl bg-white text-black font-extrabold text-sm"
              >
                Start free
              </a>
            </div>
          )}
        </div>

        <footer className="mt-8 text-xs text-white/45">
          © {new Date().getFullYear()} SupportAI • Built for embeddable support widgets
        </footer>
      </section>
    </div>
  );
}
