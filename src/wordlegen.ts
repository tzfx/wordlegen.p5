import * as p5 from "p5";
import { wordlist } from "./wordlists/words-wordle";

// Patch string for multi-index find.
// Will return a set of indices of exact matches.
//  or empty list [] if none.
(String.prototype as any).findAll = function (exact: string) {
    return this.split("")
        .map((v: string, i: number) => (v === exact ? i : null))
        .filter((v: number) => v !== null);
};

const showLetters = (): boolean =>
    !!(document.getElementById("showLetters") as any)?.checked;

const sketch = (p5: p5) => {
    let words = wordlist;

    const PADDING = 5;
    const HEIGHT = 420;
    const WIDTH = 350;
    const WORDLENGTH = 5;
    const GUESSES = 6;
    const SQUARE = WIDTH / WORDLENGTH - PADDING * 2;

    const GREEN = "#6aaa64";
    const YELLOW = "#c9b458";
    const DARK_GREY = "#787c7e";
    const OUTLINE = "#d3d6da";

    const upify = (i: number) => i + 1;
    const chooseWord = () => words[Math.floor(Math.random() * words.length)];

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
            .stroke(OUTLINE)
            .fill(color ?? "white")
            .rect(
                PADDING + SQUARE * col - SQUARE,
                PADDING + SQUARE * row - SQUARE,
                SQUARE - PADDING,
                SQUARE - PADDING
            )
            .endShape();

    const drawLetter = (
        letter: string,
        col: number,
        row: number,
        color?: string
    ) =>
        p5
            .textFont("Helvetica", 32)
            .textAlign(p5.CENTER, p5.CENTER)
            .textStyle(p5.BOLD)
            .fill("white")
            .noStroke()
            .text(
                letter.toUpperCase(),
                PADDING / 2 + SQUARE * col - SQUARE / 2,
                PADDING / 2 + SQUARE * row - SQUARE / 2
            );

    const drawGrid = () =>
        new Array(GUESSES)
            .fill(1)
            .map((_, i) => upify(i))
            .forEach((i) =>
                new Array(WORDLENGTH)
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
                    drawRect(i + 1, iteration, GREEN);
                } else {
                    near = near.filter((v) => v != c + i);
                    near.push(c + i);
                    drawRect(i + 1, iteration, YELLOW);
                }
            } else {
                none = none.filter((v) => v != c);
                none.push(c);
                drawRect(i + 1, iteration, DARK_GREY);
            }
            if (showLetters()) drawLetter(c, i + 1, iteration);
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
        new Array(WORDLENGTH)
            .fill(1)
            .map((_, i) => "" + i)
            .forEach((pos) => {
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
                const n = none
                    .join("")
                    .concat(m)
                    .concat(
                        near
                            .filter((v) => v[1] === pos)
                            .map((v) => v[0])
                            .join("")
                    );
                if (e.length > 0) {
                    search += e;
                } else {
                    if (n.length > 0 && m.length > 0) {
                        search += `([${m + e}]{1}|[^${n}]{1})`;
                    } else if (n.length > 0) search += `[^${n}]`;
                    else if (m.length > 0) search += `[${m + e}]`;
                }
            });
        search += "$";
        const regex = new RegExp(search);
        words = words.filter((w) => w.match(regex) && !already.includes(w));
        return chooseWord();
    };

    const checkSolved = () => exact.length === 5;

    p5.setup = () => {
        iteration = 1;
        p5.frameRate(1);
        p5.createCanvas(WIDTH, HEIGHT);
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
            words = wordlist;
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
