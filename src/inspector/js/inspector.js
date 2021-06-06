import * as debug from "@debug";

const LOG = document.$('#LOG');
const CMD = document.$('#CMD');

function log(subsystem, severity, msg) {
    LOG.append(<option severity={severity}>{msg}</option>);
    if (LOG.scrollTop > (LOG.scrollHeight - LOG.clientHeight - 80))
        LOG.lastElementChild.scrollIntoView({behavior:"smooth"});
    return true;
}

debug.setConsoleOutputHandler((subsystem,severity,msg) => {
    log(subsystem, severity, msg); return true;
});
debug.setUnhandledExeceptionHandler((err) => {
    log(3, 2, err.toString()); return true;
});

globalThis.console.log   = (...args) => log(3,0,args);
globalThis.console.warn  = (...args) => log(3,1,args);
globalThis.console.error = (...args) => log(3,2,args);


Window.this.connectToInspector = function (ELEMENT) {

    // ELEMENT = ELEMENT.frame.document;

    // | [x] | set console output;

    CMD.on("keydown", (evt,el) => {
      if( evt.code != "KeyRETURN" ) return;
      if( evt.shiftKey || evt.ctrlKey) return;
      let toeval = el.value.trim();
      if( !toeval ) return;
      try {
        var r = ELEMENT.frame.document.globalThis.eval(toeval);
        r == null ? console.warn('null') : console.log(r);
      } catch(e) {
        console.warn(e.message);
      }
      return true;
    });

    // | [ ] | get Style;
    
    // | [ ] | get Elements in ELEMENT;
    

    ELEMENT.on("^mousedown", function(evt)
    {
        if( evt.ctrlKey && evt.shiftKey && evt.target ) 
        {
            console.log('SELECT ', evt.target);
            return true;
        }
    });

    ELEMENT.on("^mouseup",function(evt)
    {
        if( evt.ctrlKey && evt.shiftKey )
            return true;
    });
}

LOG.onkeydown = function(evt) {
    if (evt.code == "KeyDELETE")
        for (var s of evt.target.$$(":checked")) s.remove();

    if (evt.code == "KeyC" && evt.ctrlKey)
        Clipboard.writeText(evt.target.value.join('\r\n'));

    if (evt.code == "KeyA" && evt.ctrlKey)
        for (var s of evt.target.children) s.state.checked = true;
}
