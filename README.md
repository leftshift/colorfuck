# colorfuck
art(?) through random code

## What?
We generate a random(*) chunk of brainfuck code and run it in an interpreter. The memory the program is run in is interpreted
as a bitmap and displayed on the left. Speed and code length can be varied or own code entered.

(*) random in the sense that it has to be a valid brainfuck program, e.g. the `[` and `]` have to be balanced

## Implementation notes
We're doing a few things that are pretty standard but also a few which don't quite match with other brainfuck implementations.

### Standard(ish)
* Memory wraps. Going right from the last cell leads to the first cell
* Values wrap. Incrementing the highest value will overflow to 0

## Cheats (?)
* Programs loop. After the last instruction, execution begins again from the beginning. This is done 
because a lot of programs would quite quickly terminate otherwise. If you're writing your own code and need to terminate,
you might place `0` in one cell and then run `[]` which effectively is an infinite loop
* The input instruction `,` does nothing. I'm not too happy about this but it means programs are deterministic.
Alternative approaches:
  * Let users supply an input string, return `0`s after all characters from there are exhausted
  * Supply random values. This adds even more entropy to the whole thing and might be interesting, but breaks determinism.
  Being able to share a program with someone else and have it look the same way is quite important I think, so this shouldn't
  become the default
* We don't generate programs containing `[]`. This is done because in the best case (when the value of the current
cell is zero), these instructions do nothing. If the value is nonzero, the program gets stuck here, which usually is quite boring.
Note that other kinds of loops with the same effect may still be generated, like `[+-]` or `[><]` (or infinitely more complex
noops). It might be worth filtering out some of these since they don't add much value but could be quite frustrating.
