import { c as create_ssr_component, b as add_attribute, e as escape, d as createEventDispatcher, f as each, g as compute_rest_props, h as spread, i as escape_attribute_value, j as escape_object, k as add_classes, v as validate_component, l as add_styles } from "../../chunks/index2.js";
import { getAuth } from "firebase/auth";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDoc, doc, query, where, getDocs } from "firebase/firestore";
import "sse.js";
import "file-selector";
import hljs from "highlight.js";
const LoginBlock = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let email = "";
  let password = "";
  let loginError = { status: false, message: "" };
  return `<div class="card w-96 bg-neutral text-neutral-content self-center"><div class="card-body"><h2 class="card-title">Login</h2>

		${`<form class="flex flex-col flex-wrap gap-4 justify-center h-full"><div class="form-control w-full"><label class="label" for="email"><span class="label-text">Email</span></label>
				<input id="email" type="text" placeholder="Email" class="input input-bordered w-full"${add_attribute("value", email, 0)}></div>
			<div class="form-control w-full"><label class="label" for="password"><span class="label-text">Password</span></label>
				<input id="password" type="password" placeholder="Type here" class="input input-bordered w-full"${add_attribute("value", password, 0)}></div>
			<button type="submit" class="btn btn-primary w-full">Login</button>
			<button class="btn btn-primary w-full">Sign in with google</button>
			<div class="${["alert alert-error shadow-lg", "hidden"].join(" ").trim()}"><div><svg xmlns="http://www.w3.org/2000/svg" class="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
					<span>${escape(loginError.message)}</span></div></div></form>`}</div></div>`;
});
const app$1 = "";
const firebaseConfig = {
  apiKey: "AIzaSyCTtya5MBXBpPL-AYfw5Hdf-Y70vE6MfGI",
  authDomain: "scuffedgpt.firebaseapp.com",
  projectId: "scuffedgpt",
  storageBucket: "scuffedgpt.appspot.com",
  messagingSenderId: "1031216283872",
  appId: "1:1031216283872:web:216f316c61e6f45386d085",
  measurementId: "G-VJVXMCXDNM"
};
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);
const threadsCollection = collection(firestore, "Threads");
const auth = getAuth(app);
const Dropzone_svelte_svelte_type_style_lang = "";
const Threads = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  createEventDispatcher();
  let { threads = [] } = $$props;
  let { currThreadID } = $$props;
  createEventDispatcher();
  if ($$props.threads === void 0 && $$bindings.threads && threads !== void 0)
    $$bindings.threads(threads);
  if ($$props.currThreadID === void 0 && $$bindings.currThreadID && currThreadID !== void 0)
    $$bindings.currThreadID(currThreadID);
  return `<div class="grid grid-cols-1 gap-4 menu ">${threads == null ? `<progress class="progress progress-primary w-56"></progress>` : `<button class="btn btn-outline btn-primary">New Thread
        </button>
        ${each(threads, (thread) => {
    return `${thread.id === currThreadID ? `<div class="w-full bordered flex items-center gap-1"><button class="btn btn-primary grow">${escape(thread.name == "" ? "Unnamed Thread" : thread.name)}</button>
                <button class="btn btn-ghost btn-square"><svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-x" width="24" height="24" viewBox="0 0 24 24" stroke-width="1.5" stroke="#ffffff" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
            </div>` : `<div class="w-full flex items-center gap-1"><button class="btn btn-outline btn-primary grow">${escape(thread.name == "" ? "Unnamed Thread" : thread.name)}</button>
                <button class="btn btn-ghost btn-square"><svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-x" width="24" height="24" viewBox="0 0 24 24" stroke-width="1.5" stroke="#ffffff" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
            </div>`}`;
  })}`}</div>`;
});
const LangTag_svelte_svelte_type_style_lang = "";
const css$1 = {
  code: ".langtag.svelte-1h28s4b{position:relative}.langtag.svelte-1h28s4b::after{content:attr(data-language);position:absolute;top:0;right:0;padding:1em;display:flex;align-items:center;justify-content:center;background:var(--langtag-background, inherit);color:var(--langtag-color, inherit);border-radius:var(--langtag-border-radius)}",
  map: null
};
const LangTag = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $$restProps = compute_rest_props($$props, ["langtag", "highlighted", "code", "languageName"]);
  let { langtag = false } = $$props;
  let { highlighted } = $$props;
  let { code } = $$props;
  let { languageName = "plaintext" } = $$props;
  if ($$props.langtag === void 0 && $$bindings.langtag && langtag !== void 0)
    $$bindings.langtag(langtag);
  if ($$props.highlighted === void 0 && $$bindings.highlighted && highlighted !== void 0)
    $$bindings.highlighted(highlighted);
  if ($$props.code === void 0 && $$bindings.code && code !== void 0)
    $$bindings.code(code);
  if ($$props.languageName === void 0 && $$bindings.languageName && languageName !== void 0)
    $$bindings.languageName(languageName);
  $$result.css.add(css$1);
  return `<pre${spread(
    [
      {
        "data-language": escape_attribute_value(languageName)
      },
      escape_object($$restProps)
    ],
    {
      classes: (langtag ? "langtag" : "") + " svelte-1h28s4b"
    }
  )}><code${add_classes("hljs".trim())}>${highlighted ? `<!-- HTML_TAG_START -->${highlighted}<!-- HTML_TAG_END -->` : `${escape(code)}`}</code></pre>`;
});
const HighlightAuto = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $$restProps = compute_rest_props($$props, ["code", "langtag"]);
  let { code } = $$props;
  let { langtag = false } = $$props;
  createEventDispatcher();
  let highlighted = "";
  let language = void 0;
  if ($$props.code === void 0 && $$bindings.code && code !== void 0)
    $$bindings.code(code);
  if ($$props.langtag === void 0 && $$bindings.langtag && langtag !== void 0)
    $$bindings.langtag(langtag);
  ({ value: highlighted, language } = hljs.highlightAuto(code));
  return `${slots.default ? slots.default({ highlighted }) : `
  ${validate_component(LangTag, "LangTag").$$render($$result, Object.assign({}, $$restProps, { languageName: language }, { langtag }, { highlighted }, { code }), {}, {})}
`}`;
});
const LineNumbers_svelte_svelte_type_style_lang = "";
const css = {
  code: 'pre.svelte-m51gt1.svelte-m51gt1{margin:0}table.svelte-m51gt1.svelte-m51gt1,tr.svelte-m51gt1.svelte-m51gt1,td.svelte-m51gt1.svelte-m51gt1{padding:0;border:0;margin:0;vertical-align:baseline}table.svelte-m51gt1.svelte-m51gt1{width:100%;border-collapse:collapse;border-spacing:0}tr.svelte-m51gt1:first-of-type td.svelte-m51gt1{padding-top:1em}tr.svelte-m51gt1:last-child td.svelte-m51gt1{padding-bottom:1em}td.svelte-m51gt1.svelte-m51gt1{padding-left:var(--padding-left, 1em);padding-right:var(--padding-right, 1em)}td.hljs.svelte-m51gt1.svelte-m51gt1:not(.hideBorder):after{content:"";position:absolute;top:0;right:0;width:1px;height:100%;background:var(--border-color, currentColor)}.wrapLines.svelte-m51gt1.svelte-m51gt1{white-space:pre-wrap}td.svelte-m51gt1.svelte-m51gt1,pre.svelte-m51gt1.svelte-m51gt1{position:relative}pre.svelte-m51gt1.svelte-m51gt1{z-index:1}.line-background.svelte-m51gt1.svelte-m51gt1{position:absolute;z-index:0;top:0;left:0;width:100%;height:100%}tr.svelte-m51gt1:first-of-type td .line-background.svelte-m51gt1,tr.svelte-m51gt1:last-of-type td .line-background.svelte-m51gt1{height:calc(100% - 1em)}tr.svelte-m51gt1:first-of-type td .line-background.svelte-m51gt1{top:1em}tr.svelte-m51gt1:last-of-type td .line-background.svelte-m51gt1{bottom:1em}',
  map: null
};
const DIGIT_WIDTH = 12;
const MIN_DIGITS = 2;
const HIGHLIGHTED_BACKGROUND = "rgba(254, 241, 96, 0.2)";
const LineNumbers = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let lines;
  let len_digits;
  let len;
  let width;
  let $$restProps = compute_rest_props($$props, ["highlighted", "hideBorder", "wrapLines", "startingLineNumber", "highlightedLines"]);
  let { highlighted } = $$props;
  let { hideBorder = false } = $$props;
  let { wrapLines = false } = $$props;
  let { startingLineNumber = 1 } = $$props;
  let { highlightedLines = [] } = $$props;
  if ($$props.highlighted === void 0 && $$bindings.highlighted && highlighted !== void 0)
    $$bindings.highlighted(highlighted);
  if ($$props.hideBorder === void 0 && $$bindings.hideBorder && hideBorder !== void 0)
    $$bindings.hideBorder(hideBorder);
  if ($$props.wrapLines === void 0 && $$bindings.wrapLines && wrapLines !== void 0)
    $$bindings.wrapLines(wrapLines);
  if ($$props.startingLineNumber === void 0 && $$bindings.startingLineNumber && startingLineNumber !== void 0)
    $$bindings.startingLineNumber(startingLineNumber);
  if ($$props.highlightedLines === void 0 && $$bindings.highlightedLines && highlightedLines !== void 0)
    $$bindings.highlightedLines(highlightedLines);
  $$result.css.add(css);
  lines = highlighted.split("\n");
  len_digits = lines.length.toString().length;
  len = len_digits - MIN_DIGITS < 1 ? MIN_DIGITS : len_digits;
  width = len * DIGIT_WIDTH;
  return `<div${spread([escape_object($$restProps)], {
    classes: "svelte-m51gt1",
    styles: { "overflow-x": `auto` }
  })}><table class="svelte-m51gt1"><tbody${add_classes("hljs".trim())}>${each(lines, (line, i) => {
    let lineNumber = i + startingLineNumber;
    return `
        <tr class="svelte-m51gt1"><td class="${[
      "svelte-m51gt1",
      "hljs " + (hideBorder ? "hideBorder" : "")
    ].join(" ").trim()}"${add_styles({
      "position": `sticky`,
      "left": `0`,
      "text-align": `right`,
      "user-select": `none`,
      "width": width + "px"
    })}><code${add_styles({
      "color": `var(--line-number-color, currentColor)`
    })}>${escape(lineNumber)}</code>
            ${highlightedLines.includes(i) ? `<div class="${["svelte-m51gt1", "line-background"].join(" ").trim()}"${add_styles({
      "background": `var(--highlighted-background, ${HIGHLIGHTED_BACKGROUND})`
    })}></div>` : ``}</td>
          <td class="svelte-m51gt1"><pre class="${["svelte-m51gt1", wrapLines ? "wrapLines" : ""].join(" ").trim()}"><code><!-- HTML_TAG_START -->${line || "\n"}<!-- HTML_TAG_END --></code></pre>
            ${highlightedLines.includes(i) ? `<div class="${["svelte-m51gt1", "line-background"].join(" ").trim()}"${add_styles({
      "background": `var(--highlighted-background, ${HIGHLIGHTED_BACKGROUND})`
    })}></div>` : ``}</td>
        </tr>`;
  })}</tbody></table>
</div>`;
});
const github = "pre code.hljs {\n  display: block;\n  overflow-x: auto;\n  padding: 1em;\n}\ncode.hljs {\n  padding: 3px 5px;\n} /*!\n  Theme: GitHub Dark\n  Description: Dark theme as seen on github.com\n  Author: github.com\n  Maintainer: @Hirse\n  Updated: 2021-05-15\n\n  Outdated base version: https://github.com/primer/github-syntax-dark\n  Current colors taken from GitHub's CSS\n*/\n.hljs {\n  color: #c9d1d9;\n  background: #0d1117;\n}\n.hljs-doctag,\n.hljs-keyword,\n.hljs-meta .hljs-keyword,\n.hljs-template-tag,\n.hljs-template-variable,\n.hljs-type,\n.hljs-variable.language_ {\n  color: #ff7b72;\n}\n.hljs-title,\n.hljs-title.class_,\n.hljs-title.class_.inherited__,\n.hljs-title.function_ {\n  color: #d2a8ff;\n}\n.hljs-attr,\n.hljs-attribute,\n.hljs-literal,\n.hljs-meta,\n.hljs-number,\n.hljs-operator,\n.hljs-selector-attr,\n.hljs-selector-class,\n.hljs-selector-id,\n.hljs-variable {\n  color: #79c0ff;\n}\n.hljs-meta .hljs-string,\n.hljs-regexp,\n.hljs-string {\n  color: #a5d6ff;\n}\n.hljs-built_in,\n.hljs-symbol {\n  color: #ffa657;\n}\n.hljs-code,\n.hljs-comment,\n.hljs-formula {\n  color: #8b949e;\n}\n.hljs-name,\n.hljs-quote,\n.hljs-selector-pseudo,\n.hljs-selector-tag {\n  color: #7ee787;\n}\n.hljs-subst {\n  color: #c9d1d9;\n}\n.hljs-section {\n  color: #1f6feb;\n  font-weight: 700;\n}\n.hljs-bullet {\n  color: #f2cc60;\n}\n.hljs-emphasis {\n  color: #c9d1d9;\n  font-style: italic;\n}\n.hljs-strong {\n  color: #c9d1d9;\n  font-weight: 700;\n}\n.hljs-addition {\n  color: #aff5b4;\n  background-color: #033a16;\n}\n.hljs-deletion {\n  color: #ffdcd7;\n  background-color: #67060c;\n}\n";
const CodeBlock = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { code } = $$props;
  let multiline = code.includes("\n");
  if (multiline) {
    code.split("\n");
  }
  if ($$props.code === void 0 && $$bindings.code && code !== void 0)
    $$bindings.code(code);
  return `${$$result.head += `<!-- HEAD_svelte-1wyg5b0_START --><!-- HTML_TAG_START -->${github}<!-- HTML_TAG_END --><!-- HEAD_svelte-1wyg5b0_END -->`, ""}

<div class="mockup-code my-4">${validate_component(HighlightAuto, "HighlightAuto").$$render($$result, { code }, {}, {
    default: ({ highlighted }) => {
      return `${validate_component(LineNumbers, "LineNumbers").$$render($$result, { highlighted }, {}, {})}`;
    }
  })}</div>`;
});
const ChatMessage = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { type } = $$props;
  let { message } = $$props;
  let { loading = false } = $$props;
  let { user } = $$props;
  let parts = [];
  function formatText(message2) {
    parts = message2.split("```");
    for (let i = 0; i < parts.length; i++) {
      if (i % 2 === 0) {
        parts[i] = parts[i].trim().split("\n").map((item) => `<li>${item}&nbsp;</li>`).join("");
        parts[i] = `<ul>${parts[i]}</ul>`;
      } else {
        parts[i] = { type: "Codeblock", code: parts[i] };
      }
    }
    parts.join("");
  }
  formatText(message);
  if ($$props.type === void 0 && $$bindings.type && type !== void 0)
    $$bindings.type(type);
  if ($$props.message === void 0 && $$bindings.message && message !== void 0)
    $$bindings.message(message);
  if ($$props.loading === void 0 && $$bindings.loading && loading !== void 0)
    $$bindings.loading(loading);
  if ($$props.user === void 0 && $$bindings.user && user !== void 0)
    $$bindings.user(user);
  return `<div class="${"chat " + escape(type === "user" ? "chat-end" : "chat-start", true) + " justify-end"}"><div class="chat-image avatar"><div class="w-10 rounded-full">

			${type === "user" ? `${user.photoURL ? `<img${add_attribute("src", user.photoURL, 0)} alt="user avatar">` : `<img${add_attribute("src", "https://ui-avatars.com/api/?name=" + user.email[0], 0)} alt="user avatar">`}` : `<img src="https://ui-avatars.com/api/?name=S" alt="user avatar">`}</div></div>
	<div class="chat-header">${escape(type === "user" ? user.displayName ? user.displayName : user.email.split("@")[0] : "ScuffedGPT")}</div>
	<div class="${"chat-bubble max-w-[600px] min-w-min " + escape(
    type === "user" ? "chat-bubble-primary" : "chat-bubble-secondary",
    true
  )}">${each(parts, (block) => {
    return `${typeof block === "string" ? `<!-- HTML_TAG_START -->${block}<!-- HTML_TAG_END -->` : `${validate_component(CodeBlock, "CodeBlock").$$render($$result, { code: block.code }, {}, {})}`}`;
  })}

		${loading ? `<progress class="progress progress-primary w-full"></progress>` : ``}</div></div>`;
});
const Chat = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { threadID = "" } = $$props;
  let threadname = "";
  let chatMessages = [];
  let fetching = false;
  let chatQuery = "";
  let firestore2 = getFirestore();
  let auth2 = getAuth();
  let scrollToDiv;
  createEventDispatcher();
  function scrollToBottom() {
    setTimeout(
      function() {
        scrollToDiv.scrollIntoView({
          behavior: "smooth",
          block: "end",
          inline: "nearest"
        });
      },
      100
    );
  }
  async function getThread(threadId) {
    fetching = true;
    if (threadId == "") {
      threadname = "";
      chatMessages = [];
      fetching = false;
      return;
    }
    getDoc(doc(firestore2, "Threads", threadId)).then((doc2) => {
      if (doc2.exists()) {
        threadname = doc2.data().name;
        chatMessages = doc2.data().messages;
        fetching = false;
      } else {
        threadname = "";
        chatMessages = [];
        fetching = false;
      }
    }).catch((error) => {
      console.log("Error getting document:", error);
    });
  }
  if ($$props.threadID === void 0 && $$bindings.threadID && threadID !== void 0)
    $$bindings.threadID(threadID);
  if ($$props.scrollToBottom === void 0 && $$bindings.scrollToBottom && scrollToBottom !== void 0)
    $$bindings.scrollToBottom(scrollToBottom);
  if ($$props.getThread === void 0 && $$bindings.getThread && getThread !== void 0)
    $$bindings.getThread(getThread);
  return `<div class="flex flex-col w-full px-4 items-center gap-4 grow max-h-full relative h-[0px]"><div class="form-control w-full"><div class="input-group"><input type="text" placeholder="Unnamed thread" class="input w-full input-bordered"${add_attribute("value", threadname, 0)}>
          <button class="btn btn-primary">Submit
          </button></div></div>
	<div class="w-full bg-gray-900 rounded-md p-4 overflow-y-auto flex flex-col gap-4 grow"><div class="flex flex-col gap-2">${fetching ? `<progress class="progress progress-primary w-56 place-items-center"></progress>` : `${each(chatMessages, (message) => {
    return `${validate_component(ChatMessage, "ChatMessage").$$render(
      $$result,
      {
        type: message.role,
        message: message.content,
        user: auth2.currentUser
      },
      {},
      {}
    )}`;
  })}
			${``}`}</div>
		<div class=""${add_attribute("this", scrollToDiv, 0)}></div></div>
	<form class="flex w-full rounded-md gap-4 bg-gray-900 p-4"><input type="text" class="input input-bordered w-full"${add_attribute("value", chatQuery, 0)}>
		${`<button type="submit" class="btn btn-primary">Send</button>`}</form></div>`;
});
const Layout = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let loggedIn = false;
  let uid = "";
  let allThreads = [];
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      uid = user.uid;
      loggedIn = true;
      allThreads = await load();
    } else {
      uid = "";
      loggedIn = false;
    }
  });
  async function load() {
    let threads2 = [];
    console.log("Loading threads for user: " + uid);
    const q = query(threadsCollection, where("users", "==", uid));
    const snapshot = await getDocs(q);
    snapshot.forEach((doc2) => {
      threads2.push({
        id: doc2.id,
        name: doc2.data().name,
        messages: doc2.data().messages
      });
    });
    return threads2;
  }
  let currThreadID = "";
  let chat;
  let threads;
  let $$settled;
  let $$rendered;
  do {
    $$settled = true;
    $$rendered = `<div class="drawer drawer-mobile h-[100svh] max-h-[100svh]"><input id="my-drawer-2" type="checkbox" class="drawer-toggle">
	<div class="drawer-content max-h-[100svh] flex flex-col relative"><div class="w-full navbar bg-base-100"><div class="flex-none"><label for="mrawer-2"><div class="btn btn-ghost btn-square"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="inline-block w-5 h-5 stroke-current"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg></div></label></div>
			<div class="flex-1"><span class="btn btn-ghost normal-case text-xl">ScuffedGPT</span></div></div>
		${loggedIn ? `${`${validate_component(Chat, "Chat").$$render(
      $$result,
      { threadID: currThreadID, this: chat },
      {
        this: ($$value) => {
          chat = $$value;
          $$settled = false;
        }
      },
      {}
    )}`}` : `<div class="h-full w-100 grow flex items-center place-self-center">${validate_component(LoginBlock, "LoginBlock").$$render($$result, {}, {}, {})}</div>`}</div>
	<div class="drawer-side"><label for="my-drawer-2" class="drawer-overlay"></label>
		<ul class="menu p-4 w-80 bg-base-100 text-base-content gap-4">

			${loggedIn ? `<form><button type="submit" class="btn btn-primary w-full">Logout</button></form>
				<button class="btn btn-secondary w-full">Transcribe
				</button>
				${validate_component(Threads, "Threads").$$render(
      $$result,
      {
        threads: allThreads,
        currThreadID,
        this: threads
      },
      {
        this: ($$value) => {
          threads = $$value;
          $$settled = false;
        }
      },
      {}
    )}` : ``}</ul></div></div>`;
  } while (!$$settled);
  return $$rendered;
});
export {
  Layout as default
};
