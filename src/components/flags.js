import BaseComponent from "@/components/base";
import { makeEl } from "@/make-el";


export default class CodeComponent extends BaseComponent {

    constructor(options) {
        super();
        this.element = makeEl('ol', 'flags');
    }

    init(machine) {
        const availableFlags = machine.options.availableFlags;
        const flags = machine.flags;

        availableFlags.forEach((flag) => {
            const item = document.createElement('li');
            item.dataset.flag = flag;
            item.dataset.on = flags[flag] ? 'yes' : 'no';

            this.element.appendChild(item);
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
