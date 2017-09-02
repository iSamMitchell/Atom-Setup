{ quote } = require '../lib/quote-words'

single = "'"
double = '"'

test = (input, singled, doubled) ->
    expect(quote(input, single)).toEqual(singled)
    expect(quote(input, double)).toEqual(doubled)

describe "empty selection", ->
    it "returns empty replacement", ->
        test '', '', ''

describe "single word", ->
    it "returns quoted replacement", ->
        test 'word',
            "'word'",
            '"word"'

describe "comma separated", ->
    it "quotes bare words", ->
        test 'FOO, BAR, QUX',
            "'FOO', 'BAR', 'QUX'",
            '"FOO", "BAR", "QUX"'

describe "existing quotes", ->
    it "ignores same", ->
        expect(quote("'FOO'", single)).toEqual("'FOO'")
        expect(quote('"FOO"', double)).toEqual('"FOO"')
    it "updates to different", ->
        expect(quote('"FOO"', single)).toEqual("'FOO'")
        expect(quote("'FOO'", double)).toEqual('"FOO"')

describe "mixed input", ->
    it "updates where different", ->
        test "\"FOO\", 'BAR',\nFOO_BAR\n, FIZZY_1 : Q-U-X",
            "'FOO', 'BAR',\n'FOO_BAR'\n, 'FIZZY_1' : 'Q'-'U'-'X'",
            '"FOO", "BAR",\n"FOO_BAR"\n, "FIZZY_1" : "Q"-"U"-"X"'

describe "complex input", ->
    it "behaves naively", ->
        test 'https://github.com',
            "'https'://'github'.'com'",
            '"https"://"github"."com"'

describe "space separated words", ->
    it "quotes two at once", ->
        test 'French Polynesia',
            "'French Polynesia'",
            '"French Polynesia"'
    it "quotes three at once", ->
        test 'French Southern Territories',
            "'French Southern Territories'",
            '"French Southern Territories"'

describe "comma and space separated", ->
    it "quotes all words between commas", ->
        test 'French Polynesia, French Southern Territories',
            "'French Polynesia', 'French Southern Territories'",
            '"French Polynesia", "French Southern Territories"'
