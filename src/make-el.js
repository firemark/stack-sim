function createEl(name) {
    return document.createElement(name);
}

export function makeEl(tag, className, content) {
    var el = createEl(tag);
    if (className !== undefined) {
        el.className = className;
    }
    if (content !== undefined) {
        el.textContent = content;
    }
    return el;
}


export function makePanelEl(example) {
    var buttonReset = createEl('button');
    buttonReset.textContent = 'reset';
    buttonReset.onclick = () => example.actionReset();

    var buttonStep = createEl('button');
    buttonStep.textContent = 'step';
    buttonStep.onclick = () => example.actionStep();

    var panelEl = createEl('div');
    panelEl.className = 'panel';
    panelEl.appendChild(buttonStep);
    panelEl.appendChild(buttonReset);
    return panelEl;
}
