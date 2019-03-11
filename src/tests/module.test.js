import "https://unpkg.com/mocha@5.2.0/mocha.js"; /* globals mocha */
import "https://unpkg.com/chai@4.1.2/chai.js"; /* globals chai */

import * as Module from "/common/modules/Module.js";

describe("common module: Module", function () {
    describe("CONSTANT", function () {
        it("is there", function () {
            chai.assert.exists(Module.CONSTANT);
            chai.assert.isNotEmpty(Module.CONSTANT);
        });

        it("is frozen", function () {
            chai.assert.isFrozen(Module.CONSTANT);
        });
    });

    describe("function()", function () {
        it("does something useful", function () {
            chai.assert.strictEqual(Module.function(1, 2), 3);
        });
    });
});
