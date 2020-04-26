function byId (id) {
    return document.getElementById(id);
}

function escapeVal(val) {
    return val
        .toString()
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
    ;
}

var RENDER_FUNCTIONS = {
    int: function (val) { return escapeVal(val); },
    hex: function (val) { 
        if (typeof val !== 'number') {
            return escapeVal(val);
        }
        return '0x' + val.toString(16);
    },
    chr: function (val) { 
        if (typeof val !== 'number') {
            return escapeVal(val);
        }
        val = val % 255;
        if (val < 32 || val > 126) {
            return escapeVal(val);
        }
        var chr = String.fromCharCode(val);
        return chr + '<small>(' + escapeVal(val) + ')</small>';
    },
};

function Example(container, code, components, options) {
    options = options || {};

    function init() {
        this.options = {
            stackSize: options.stackSize || 0x200A,
            stackLabels: options.stackLabels || {},
            parseVal: options.parseVal || this.defaultParseVal,
        }
        this.code = code;
        this.container = container;
        this.components = components;
        this.reset();

        var upEl = makeEl('div', 'up');
        var panelEl = makePanelEl(this);
        var machine = this;

        components.forEach(function (component) {
            component.init(machine);
            upEl.appendChild(component.element);
        });

        container.appendChild(upEl);
        container.appendChild(panelEl);
        container.className = "example";
    }

    this.defaultParseVal = function (v) {
        if (v && v[0] === ':') {
            return v.charCodeAt(1);
        }
        return parseInt(v);
    }

    this.actionStep = function () {
        if (this.boom) {
            return;
        }

        this.step = this.nextStep;
        if (this.step >= this.code.length) 
            return;

        try {
            this.doIt();
        } catch (e) {
            console.error(e);
        }

        this.draw();
        this.updateOldStack();
    }

    this.actionReset = function () {
        this.reset();
        this.draw();
    }

    this.draw = function () {
        var machine = this;
        this.components.forEach(function (component) {
            component.draw(machine);
        });
    }

    this.reset = function () {
        this.clearStack();
        this.clearCode();
        this.step = -1;
        this.nextStep = 0;
        this.boom = false;
    }

    this.clearStack = function () {
        this.stack = [];
        for(let i=0; i < this.options.stackSize; i++) {
            this.stack.push('???');
        }
        this.updateOldStack();
    }

    this.clearCode = function () {
        this.code.forEach(function (line) {
            line.firstExecuted = false;
            line.boom = false;
            line.errorMsg = false;
        });
    }

    this.updateOldStack = function () {
        this.oldStack = this.stack.slice();
    }
    
    this.doIt = function () {
        var line = this.code[this.step];
        var stack = this.stack;
        var actions = line.action.split(';');
        if (line.firstAction && !line.firstExecuted) {
            line.firstExecuted = true;
            actions = line.firstAction.split(';').concat(actions);
        }
        var labels = this.options.stackLabels;
        var machine = this;
        var parseVal = this.options.parseVal;

        function executeSet(args) {
            var valueInStack = stack[args[0]];
            if (valueInStack === undefined) boom("segmentation fault");
            stack[args[0]] = parseVal(args[1]);
        }

        function executeBinOp(args, op) {
            var valueInStack = stack[args[0]];
            if (valueInStack === undefined) boom("segmentation fault");
            var a = parseVal(valueInStack);
            var b = parseVal(args[1]);
            if (isNaN(a) || isNaN(b)) {
                stack[args[0]] = '???';
            } else {
                stack[args[0]] = eval('a' + op + 'b');
            }
        }

        function ifJump(args, op) {
            var hasQuestionMark = args[2] == '?';
            if (!hasQuestionMark) {
                console.warn('if doesnt have a question mark!');
                return;
            }
            var a = parseVal(args[0]);
            var b = parseVal(args[1]);
            var trueStep = parseVal(args[3]);
            var falseStep = parseVal(args[4]);

            var isTrue = eval('a' + op + 'b');
            machine.nextStep += (isTrue ? trueStep: falseStep) - 1;
        }

        function pointerFromStack(val) {
            var deep = val.match(/&/g).length;
            val = val.substr(deep);
            for(var i=0; i < deep; i++) {
                var index = parseInt(val);
                if (isNaN(index)) boom("wrong value in pointer:" + index);
                val = stack[index];
                if (val === undefined) boom("segmentation fault");
            }
            return parseVal(val);
        }

        function boom(msg) {
            line.boom = true;
            line.errorMsg = msg;
            machine.boom = true;
            throw msg;
        }

        this.nextStep = this.step + 1;
        actions.forEach(function (action) {
            var rawArgs = action.trim().split(/ +/);
            var actionName = rawArgs[0];

            var args = rawArgs.splice(1).map(function (arg) {
                return arg
                    .replace(/\$([\w_]+)/g, function (_, label) {
                        if (label === '_STEP') {
                            return (machine.step + 1).toString();
                        }
                        var label = labels[label];
                        var index = typeof label === 'number' ? label : label.index;
                        if (index === undefined) boom("unknown label:" + label);
                        return index.toString();
                    })
                    .replace(/(&+\d+)/g, function (_, val) {
                        return pointerFromStack(val).toString();
                    })
                    .replace(/(\d+)([+-])(\d+)/g, function (_, val, sign, offset) {
                        var index = parseInt(val);
                        var offset = parseInt(offset);
                        if (sign === '-') offset = -offset;
                        if (isNaN(index)) boom("wrong value in offset:" + index);
                        if (isNaN(offset)) boom("wrong offset in offset:" + offset);
                        return (index + offset).toString();
                    })
                    .replace(/(\^+\d+)/g, function (_, val) {
                        return pointerFromStack(val.replace(/\^/g, '&')).toString();
                    })
                ;
            });

            switch(actionName) {
                case 'set': executeSet(args); break;
                case 'add': executeBinOp(args, '+'); break;
                case 'sub': executeBinOp(args, '-'); break;
                case 'mul': executeBinOp(args, '*'); break;
                case 'div': executeBinOp(args, '/'); break;
                case 'if!': ifJump(args, '!='); break;
                case 'if=': ifJump(args, '=='); break;
                case 'if<': ifJump(args, '<'); break;
                case 'if>': ifJump(args, '>'); break;
                case 'if<=': ifJump(args, '<='); break;
                case 'if>=': ifJump(args, '>='); break;
                case 'jmp': 
                    var step = parseVal(args[0]);
                    if (!isNaN(step)) {
                        machine.nextStep = step;
                    }
                break;
                case 'rjmp': 
                    var relativeStep = parseVal(args[0]);
                    if (!isNaN(relativeStep)) {
                        machine.nextStep += relativeStep;
                    }
                break;
                case 'nop': break;
                default: console.warn('undefined action:', actionName); break;
            }

        });
    }

    init.apply(this);
}


function makeEl(tag, className, content) {
    var el = document.createElement(tag);
    if (className !== undefined) {
        el.className = className;
    }
    if (content !== undefined) {
        el.textContent = content;
    }
    return el;
}


function makePanelEl(example) {
    var buttonReset = document.createElement('button');
    buttonReset.textContent = 'reset';
    buttonReset.onclick = function () { example.actionReset(); }

    var buttonStep = document.createElement('button');
    buttonStep.textContent = 'step';
    buttonStep.onclick = function () { example.actionStep(); }

    var panelEl = document.createElement('div');
    panelEl.className = 'panel';
    panelEl.appendChild(buttonStep);
    panelEl.appendChild(buttonReset);
    return panelEl;
}
