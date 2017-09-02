# Atom quote-words package
Quotes the separated words in the selected text.

## Installing
Use the Atom package manager, which can be found in the Settings view, to search for and install quote-words. Or on the command line

```
apm install quote-words
```

## Usage
Select words to quote such that this:

```
FOO, BAR, QUX
```

becomes this:

```
"FOO", "BAR", "QUX"
```

It looks for words containing standard word characters: letters, numbers and underscores. You may choose to use double or single quotes. It will update any existing quotes, either double or single, to your chosen quote character:

```
"FOO", 'BAR',
FOO_BAR
, FIZZY_1 : Q-U-X
```

becomes this:

```
"FOO", "BAR",
"FOO_BAR"
, "FIZZY_1" : "Q"-"U"-"X"
```

Multiple words appearing between punctuation separators are quoted together:

```
French Polynesia, French Southern Territories
```

becomes this:

```
"French Polynesia", "French Southern Territories"
```

More complex strings are treated naively:

```
https://github.com
```

becomes this:

```
"https"://"github"."com"
```

The commands are accessible from Packages -> Quote Words, context-menu -> Quote Words or default shortcuts:

`ctrl-"` and `ctrl-'`

You may need to install [keyboard-localization](https://atom.io/packages/keyboard-localization) for the shortcuts to work as expected with your keyboard.

## License
MIT
