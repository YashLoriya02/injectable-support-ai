(function () {
    var GLOBAL = "SupportAI";
    var SOURCE = "supportai_widget";

    function getCurrentScriptSrc() {
        if (document.currentScript && document.currentScript.src) {
            return document.currentScript.src;
        }

        var scripts = document.getElementsByTagName("script");
        var last = scripts[scripts.length - 1];
        return last && last.src ? last.src : "";
    }

    function deriveEmbedBaseUrl() {
        var src = getCurrentScriptSrc();
        try {
            var u = new URL(src, window.location.href);
            return u.origin + "/embed";
        } catch (e) {
            return window.location.origin + "/embed";
        }
    }

    function applyIframeChrome(iframe, isOpen) {
        if (isOpen) {
            iframe.style.borderRadius = "16px";
            iframe.style.boxShadow = "0 10px 30px rgba(0,0,0,0.35)";
        } else {
            iframe.style.borderRadius = "999px";
            iframe.style.boxShadow = "0 8px 20px rgba(0,0,0,0.25)";
        }
    }

    var DEFAULTS = {
        embedBaseUrl: deriveEmbedBaseUrl(),
        position: "bottom-right",
        offsetX: 16,
        offsetY: 16,
        zIndex: 2147483647,
        width: 380,
        height: 520,
        collapsedSize: 44,
        startOpen: false,
    };

    function safeAssign(target, src) {
        if (!src) return target;
        for (var k in src) {
            if (Object.prototype.hasOwnProperty.call(src, k)) target[k] = src[k];
        }
        return target;
    }

    function buildEmbedUrl(base, params) {
        var q = [];
        for (var k in params) {
            if (!Object.prototype.hasOwnProperty.call(params, k)) continue;
            q.push(encodeURIComponent(k) + "=" + encodeURIComponent(String(params[k])));
        }
        return base + (base.indexOf("?") >= 0 ? "&" : "?") + q.join("&");
    }

    function createContainer(id, zIndex) {
        var el = document.getElementById(id);
        if (el) return el;

        el = document.createElement("div");
        el.id = id;
        el.style.position = "fixed";
        el.style.zIndex = String(zIndex);
        el.style.pointerEvents = "none";

        el.style.margin = "0";
        el.style.padding = "0";

        document.body.appendChild(el);
        return el;
    }

    function setPosition(el, position, offsetX, offsetY) {
        el.style.left = "";
        el.style.right = "";
        el.style.top = "";
        el.style.bottom = "";
        el.style.transform = "translateZ(0)";
        el.style.maxWidth = "100vw";
        el.style.maxHeight = "100vh";

        if (position === "bottom-left") {
            el.style.left = offsetX + "px";
            el.style.bottom = offsetY + "px";
        } else if (position === "top-right") {
            el.style.right = offsetX + "px";
            el.style.top = offsetY + "px";
        } else if (position === "top-left") {
            el.style.left = offsetX + "px";
            el.style.top = offsetY + "px";
        } else {
            el.style.right = offsetX + "px";
            el.style.bottom = offsetY + "px";
        }
    }

    function createIframe(src) {
        var iframe = document.createElement("iframe");
        iframe.src = src;
        iframe.title = "SupportAI Widget";
        iframe.style.border = "0";
        iframe.style.display = "block";
        iframe.style.overflow = "hidden";
        iframe.style.pointerEvents = "auto";
        iframe.style.background = "transparent";
        iframe.allow = "clipboard-write";
        return iframe;
    }

    function setIframeSize(iframe, w, h) {
        iframe.style.width = w + "px";
        iframe.style.height = h + "px";
    }

    function getAllowedOrigin(embedBaseUrl) {
        try {
            var u = new URL(embedBaseUrl, window.location.href);
            return u.origin;
        } catch (e) {
            return null;
        }
    }

    function init(options) {
        options = options || {};
        var appKey = (options.appKey || "").trim();
        if (!appKey) {
            console.error("[SupportAI] Missing appKey in SupportAI.init({ appKey })");
            return;
        }

        if (window[GLOBAL] && window[GLOBAL].__inited) {
            console.warn("[SupportAI] Already initialized. Ignoring init().");
            return;
        }

        var cfg = safeAssign(safeAssign({}, DEFAULTS), options);

        var containerId = "supportai-widget-container";
        var container = createContainer(containerId, cfg.zIndex);
        setPosition(container, cfg.position, cfg.offsetX, cfg.offsetY);

        var isOpen = Boolean(cfg.startOpen);
        var collapsed = Number(cfg.collapsedSize) || 50;

        var embedUrl = buildEmbedUrl(cfg.embedBaseUrl, {
            appKey: appKey,
            mode: isOpen ? "open" : "collapsed",
            parentOrigin: window.location.origin,
        });

        var iframe = createIframe(embedUrl);

        if (isOpen) setIframeSize(iframe, cfg.width, cfg.height);
        else setIframeSize(iframe, collapsed, collapsed);

        applyIframeChrome(iframe, isOpen);

        container.innerHTML = "";
        container.appendChild(iframe);

        var allowedOrigin = getAllowedOrigin(cfg.embedBaseUrl);

        function onMessage(event) {
            if (allowedOrigin && event.origin !== allowedOrigin) return;

            var data = event.data;
            if (!data || data.source !== SOURCE) return;

            if (data.type === "OPEN") {
                isOpen = true;
                setIframeSize(iframe, cfg.width, cfg.height);
                applyIframeChrome(iframe, true);
                return;
            }

            if (data.type === "CLOSE") {
                isOpen = false;
                setIframeSize(iframe, collapsed, collapsed);
                applyIframeChrome(iframe, false);
                return;
            }
        }

        window.addEventListener("message", onMessage);

        window[GLOBAL] = window[GLOBAL] || {};
        window[GLOBAL].__inited = true;

        window[GLOBAL].destroy = function () {
            window.removeEventListener("message", onMessage);
            var el = document.getElementById(containerId);
            if (el && el.parentNode) el.parentNode.removeChild(el);
            window[GLOBAL].__inited = false;
        };

        console.log("[SupportAI] Widget mounted");
    }

    window[GLOBAL] = window[GLOBAL] || {};
    window[GLOBAL].init = init;
})();
