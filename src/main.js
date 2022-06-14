//| Sciter View v0.7.1
//| https://github.com/MustafaHi/Sciter-View

const HTML = document.$('#HTML'), CSS = document.$('#CSS'), SCRIPT = document.$('#SCRIPT'), 
      VIEW = document.$('#VIEW'), INSPECTOR = document.$('#INSPECTOR');

function debounce(func, wait, immediate = false) {
    var timeout;
    return function() {
        var context = this, args = arguments;
        var later = function() {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (immediate) func.apply(context, args);
    };
}

function Render() {
    VIEW.frame.loadHtml(
        `<html>\n<body>\n${HTML.value}\n</body>\n\n<style>\n${CSS.value}\n</style>\n\n<script type='module'>\n${SCRIPT.value}\n</script>\n</html>`,
        document.url()
    );
}
const postRender = debounce(Render, 1000);

document.ready = function() {
    INSPECTOR.frame.loadFile("src/inspector/js/inspector.htm");
    Render();
}

INSPECTOR.on("complete", () => Window.this.connectToInspector(VIEW));
document.$("#toggleInspector").on("change", (evt, This) => document.setAttribute("inspector", This.value));

document.$("#RUN").on("click", Render);

document.$("#LOAD").on("click", () => {
    var fn = Window.this.selectFile({mode: "open", filter: "HTML File (*.htm,*.html)|*.html;*.htm|All Files (*.*)|*.*"});
    if(!fn) return;
    
    VIEW.frame.loadFile(fn);
    HTML  .value = VIEW.frame.document.$("body")  ?.innerHTML?.trim(); HTML  .post(new Event("change"));
    CSS   .value = VIEW.frame.document.$("style") ?.innerHTML?.trim(); CSS   .post(new Event("change"));
    SCRIPT.value = VIEW.frame.document.$("script")?.innerHTML?.trim(); SCRIPT.post(new Event("change"));
});
document.$("#SAVE").on("click", () => {
    var fn = Window.this.selectFile ({
        mode: "save", 
        filter: "HTML File (*.htm,*.html)|*.html;*.htm|All Files (*.*)|*.*",
        extension: "html",
        caption: "Save As"
    });
    if (fn) VIEW.frame.saveFile(fn);
});

class Editor extends Element {

    ["on change"]() { document.$('#LIVE').value && postRender(); }
    ["on ^keypress"](evt) {
        if (evt.shiftKey) for(var key of this.WrapKeys)
        if (evt.key == key.code) return this.Wrap(key.v);
    }
    onkeydown(evt) {
        if (evt.ctrlKey)
            switch(evt.keyCode) {
                case  93: return this.Tab(true);  // ]
                    break;
                case  91: return this.Tab(false); // [
                    break;
                                                  // ENTER
                case 257: return this.newLine(evt.shiftKey ? "top" : "bottom"); 
                    break;
            }
        if (evt.keyCode == 257) this.post(() => this.newLine("keep"));
    }

    WrapKeys = [
        { code: '{', v: ['{','}'] }, // { 123
        { code: '<', v: ['<','>'] }, // <  60
        { code: '(', v: ['(',')'] }, // (  40
    ];

    Wrap(v) {
        var S    = this.plaintext.selectionStart,
            E    = this.plaintext.selectionEnd,
            Text = this.plaintext.selectionText;

        this.execCommand("edit:insert-text", v[0] + Text + v[1]);
        this.selection.setBaseAndExtent(this.children[S[0]].firstChild, ++S[1],
                                        this.children[E[0]].firstChild, E[0] == S[0] ? ++E[1] : E[1]);
        return true;
    }

    Tab(add) {
        var Start = this.plaintext.selectionStart,
            End   = this.plaintext.selectionEnd;

        var S = Start[0] < End[0] ? Start : End,
            E = Start[0] > End[0] ? Start : End;
            
        this.plaintext.update((transact) => {
            for(var i =  S[0]; i <= E[0]; ++i) {
                var t =  this.children[i];
                if (add) transact.setText(t, '\t' + t.textContent);
                else     transact.setText(t, t.textContent.replace(/^\t/, ""));
            }
            S = Start, E = End;
            this.selection.setBaseAndExtent(this.children[S[0]].firstChild, add ? ++S[1] : --S[1],
                                            this.children[E[0]].firstChild, add ? ++E[1] : --E[1]);
            return true;
        });
        return true;
    }

    newLine(at) {
        function repeat(string, times) {
            if (times == 0) return '';
            let add = string;
            while (times != 1) { string += add; --times; }
            return string;
        }

        //| check if current line has tabs and/or end with {
        //| indent the new line accordingly

        this.plaintext.update((ctx) => {
            if (at == 'keep')
            {
                var S    = this.plaintext.selectionStart,
                    tabs = this.plaintext[S[0] - 1].match(/\t|\{$/g)?.length || 0;
                if (tabs) ctx.execCommand("edit:insert-text", repeat("\t", tabs));

                if (this.plaintext[S[0]][tabs] == "}") {
                    ctx.execCommand("edit:insert-text", "\r\n" + repeat("\t", tabs - 1));
                }
                this.plaintext.selectRange(0, 0, S[0], 999);
            }
            else if (at == "top") //| (ctrl+shift+enter)
            {
                var S    = this.plaintext.selectionStart,
                    tabs = this.plaintext[S[0]].match(/\t/g)?.length || 0;
                ctx.execCommand("navigate:line-start");
                ctx.execCommand("edit:insert-text", repeat("\t", tabs) + "\r\n");
                this.plaintext.selectRange(0, 0, S[0], tabs);
            }
            else if (at == "bottom") //| (ctrl+enter)
            {
                var S    = this.plaintext.selectionStart,
                    tabs = this.plaintext[S[0]].match(/\t|\{$/g)?.length || 0;
                ctx.execCommand("navigate:line-end");
                ctx.execCommand("edit:insert-text", "\r\n" + repeat("\t", tabs));
            }
            return true;
        });
        return true;
    }
}
