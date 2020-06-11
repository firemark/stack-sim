import BaseComponent from "@/components/base";
import { makeEl } from "@/make-el";


export default class CodeComponent extends BaseComponent {

    constructor(options) {
        this.element = makeEl('ol', 'code');
        options = options || {};
        this.options = {
            start: options.start !== undefined ? options.start : 0,
            size: options.size,
        };
    }

    init(machine) {
        const element = this.element;
        const size = this.options.size || machine.code.length;
        const start = this.options.start;
        element.start = start;

        for(var i = 0; i < size; i++) {
            var index = i + start;
            var line = machine.code[index];
            if (line === undefined) {
                break;
            }
            var itemCode = makeEl('code', 'language-c', line.line);
            var itemErr = makeEl('span', 'error');

            var item = document.createElement('li');
            item.dataset.index = index;
            item.dataset.active = 'no';
            item.appendChild(itemCode);
            item.appendChild(itemErr);

            element.appendChild(item);
        };
    }

    draw(machine) {
        const items = this.element.querySelectorAll('li');
        const step = machine.step;
        const code = machine.code;
        items.forEach((item) => {
            var line = code[item.dataset.index];
            item.dataset.boom = line.boom ? 'yes' : 'no';
            item.dataset.active = step == item.dataset.index ? 'yes' : 'no'
            if (line.errorMsg) {
                item.querySelector('.error').textContent = line.errorMsg;
            }
        })
    }
}
