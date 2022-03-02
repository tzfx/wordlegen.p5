import * as p5 from "p5";
import { wordlist } from "./words-wordle";

// Patch string for multi-index find.
// Will return a set of indices of exact matches.
//  or empty list [] if none.
(String.prototype as any).findAll = function (exact: string) {
    return this.split("")
        .map((v: string, i: number) => (v === exact ? i : null))
        .filter((v: number) => v !== null);
};

const sketch = (p5: p5) => {
    const padding = 5;
    const height = 420;
    const width = 350;
    const square = width / 5 - padding * 2;
    const upify = (i: number) => i + 1;
    const chooseWord = () =>
        wordlist[Math.floor(Math.random() * wordlist.length)];

    let solved = false;
    let word: string;
    let guess: string;
    let iteration = 1;

    let none: string[] = [];
    let near: string[] = [];
    let exact: string[] = [];

    let already: string[] = [];

    const drawRect = (col: number, row: number, color?: string) =>
        p5
            .beginShape()
            .stroke("#d3d6da")
            .fill(color ?? "white")
            .rect(
                padding + square * col - square,
                padding + square * row - square,
                square - padding,
                square - padding
            )
            .endShape();

    const drawLetter = (
        letter: string,
        col: number,
        row: number,
        color?: string
    ) =>
        p5
            .textFont("Helvetica Neue", 32)
            .textAlign(p5.CENTER, p5.CENTER)
            .textStyle(p5.BOLD)
            .fill("white")
            .noStroke()
            .text(
                letter.toUpperCase(),
                padding / 2 + square * col - square / 2,
                padding / 2 + square * row - square / 2
            );

    const drawGrid = () =>
        new Array(6)
            .fill(1)
            .map((_, i) => upify(i))
            .forEach((i) =>
                new Array(5)
                    .fill(1)
                    .map((_, j) => upify(j))
                    .forEach((j) => drawRect(j, i))
            );

    const compare = (g: string) =>
        g.split("").forEach((c, i) => {
            // Cast to any to get patched func.
            const hits: number[] = (word as any).findAll(c);
            if (hits.length > 0) {
                if (hits.some((n) => n === i)) {
                    exact = exact.filter((v) => v != c + i);
                    exact.push(c + i);
                    drawRect(i + 1, iteration, "#6aaa64");
                } else {
                    near = near.filter((v) => v != c + i);
                    near.push(c + i);
                    drawRect(i + 1, iteration, "#c9b458");
                }
            } else {
                none = none.filter((v) => v != c);
                none.push(c);
                drawRect(i + 1, iteration, "#787c7e");
            }
            drawLetter(c, i + 1, iteration);
        });

    /**
     * Creates a new guess based on previous results.
     * @returns A new word!
     */
    const newGuess = () => {
        if (iteration === 1) {
            return chooseWord();
        }
        let search = "^";
        ["0", "1", "2", "3", "4"].forEach((pos) => {
            // Exact matches.
            const e = exact
                .filter((v) => v[1] === pos)
                .map((v) => v[0])
                .join("");
            // Maybe matches.
            const m = near
                .filter((v) => v[1] !== pos)
                .map((v) => v[0])
                .join("");
            // Never matches.
            const n = none.join("").concat(m);
            if (e.length > 0) {
                search += e;
            } else {
                if (n.length > 0 && m.length > 0) {
                    search += `([${m + e}]{1}|[^${n}]{1})`;
                } else if (n.length > 0) search += `[^${n}]{1}`;
                else if (m.length > 0) search += `[${m + e}]{1}`;
            }
        });
        search += "$";
        const regex = new RegExp(search);
        const narrowed = wordlist.filter(
            (w) => w.match(regex) && !already.includes(w)
        );
        return narrowed[Math.floor(Math.random() * narrowed.length)];
    };

    const checkSolved = () => exact.length === 5;

    p5.setup = () => {
        iteration = 1;
        p5.frameRate(1);
        p5.createCanvas(width, height);
        p5.background("white");
        // Setup grid.
        drawGrid();
        // Get initial word.
        word = chooseWord();
    };

    p5.draw = () => {
        // Reset if solved or exhausted.
        if (solved || iteration === 7) {
            iteration = 1;
            drawGrid();
            none = [];
            near = [];
            exact = [];
            already = [];
            solved = false;
            word = chooseWord();
        }
        guess = newGuess();
        already.push(guess);
        compare(guess);
        solved = checkSolved();
        if (!solved) {
            iteration++;
        }
    };
};

new p5(sketch);
