//| Sciter View v0.4
//| https://github.com/MustafaHi/Sciter-View

const HTML  = document.$('#HTML'), CSS    = document.$('#CSS'), 
      Frame = document.$('frame'), SCRIPT = document.$('#SCRIPT');

function Render() {
    Frame.frame.loadHtml(
        `<html><body>${HTML.value}</body><style>${CSS.value}</style><script type='module'>${SCRIPT.value}</script></html>`,
        document.url()
    );
} Render();

document.on( 'change', 'plaintext', debounce(Render, 1000) );

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

class Editor extends Element {

    ["on ^keypress"](evt) {
        if (evt.shiftKey) for(var key of this.WrapKeys)
        if (evt.key == key.code) return this.Wrap(key.v);
    }
    onkeydown(evt) {
        if (evt.ctrlKey)
            switch(evt.keyCode) {
                case 221: return this.Tab(true);  // ]
                    break;
                case 219: return this.Tab(false); // [
                    break;
                                                  // ENTER
                case  13: return this.newLine(evt.shiftKey ? "top" : "bottom"); 
                    break;
            }
        if (evt.keyCode == 13) this.post(() => this.newLine("keep"));
    }

    WrapKeys = [
        { code: '{', v: ['{','}'] }, // { 123
        { code: '<', v: ['<','>'] }, // <  60
        { code: '(', v: ['(',')'] }, // (  40
    ];

    Wrap(v) {
        var Start = this.plaintext.selectionStart,
            End   = this.plaintext.selectionEnd,
            Text  = this.plaintext.selectionText;

        var S = Start[0] < End[0] ? Start : End,
            E = Start[0] > End[0] ? Start : End;

        this.execCommand("edit:insert-text", v[0] + Text + v[1]);
        this.plaintext.selectRange(S[0], S[1], E[0], S[0] == E[0] ? E[1]+1 : E[1]);
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
            this.plaintext.selectRange(S[0], S[1], E[0], add ? E[1]+1 : E[1]-1);
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

        //| check if current line has tabs and/or end with > or {
        //| indent the new line accordingly

        if (at == "keep") //| (enter)
        { 
            var S    = this.plaintext.selectionStart,
                tabs = this.plaintext[S[0]-1].match(/\t|\>$|\{$/g)?.length || 0;
            if (tabs)  this.execCommand("edit:insert-text", repeat("\t", tabs));

            if        (this.plaintext[S[0]].endsWith("}")) {
                       this.execCommand("edit:insert-break");
                       this.plaintext.selectRange(0, 0, S[0], 999);
            }
        }
        else if (at == "top") //| (ctrl+shift+enter)
        { 
            var S    = this.plaintext.selectionStart,
                tabs = this.plaintext[S[0]].match(/\t/g)?.length || 0;
                       this.execCommand("navigate:line-start");
                       this.execCommand("edit:insert-text", repeat("\t", tabs) + "\r\n");
                       this.plaintext.selectRange(0, 0, S[0], 999);
        } 
        else if (at == "bottom") //| (ctrl+enter)
        { 
            var S    = this.plaintext.selectionStart,
                tabs = this.plaintext[S[0]].match(/\t|\>$|\{$/g)?.length || 0;
                       this.execCommand("navigate:line-end");
                       this.execCommand("edit:insert-text", "\r\n" + repeat("\t", tabs));
        }
        return true;
    }
}
