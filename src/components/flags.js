import BaseComponent from "@/components/base";
import { makeEl } from "@/make-el";


export default class CodeComponent extends BaseComponent {

    constructor(options={}) {
        super();
        this.element = makeEl('div', 'flags');
        this.label = options.label || 'FLAGS';
    }

    init(machine) {
        const availableFlags = machine.options.availableFlags;
        const flags = machine.flags;

        const labelEl = makeEl('div', 'header', this.label);
        this.element.appendChild(labelEl);

        const listEl = document.createElement('ul');
        this.element.appendChild(listEl);

        availableFlags.forEach((flag) => {
            const item = document.createElement('li');
            item.textContent = flag;
            item.dataset.flag = flag;
            item.dataset.on = flags[flag] ? 'yes' : 'no';

            listEl.appendChild(item);
        });
    }

    draw(machine) {
        const items = this.element.querySelectorAll('li');
        const flags = machine.flags;

        items.forEach((item) => {
            const flag = item.dataset.flag;
            item.dataset.on = flags[flag] ? 'yes' : 'no';
        })
    }
}
