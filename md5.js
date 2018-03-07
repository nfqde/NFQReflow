export default class MD5
{
    constructor() {
        this.hexTable = '0123456789abcdef'.split('');
        this.unicodeArray = [
            [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
            [1, 6, 11, 0, 5, 10, 15, 4, 9, 14, 3, 8, 13, 2, 7, 12],
            [5, 8, 11, 14, 1, 4, 7, 10, 13, 0, 3, 6, 9, 12, 15, 2],
            [0, 7, 14, 5, 12, 3, 10, 1, 8, 15, 6, 13, 4, 11, 2, 9]
        ];
        this.sineArray = [
            [7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22],
            [5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20],
            [4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23],
            [6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21]
        ];
        this.tableArray = [
            [
                -680876936, -389564586, 606105819, -1044525330,
                -176418897, 1200080426, -1473231341, -45705983,
                1770035416, -1958414417, -42063, -1990404162,
                1804603682, -40341101, -1502002290, 1236535329
            ],
            [
                -165796510, -1069501632,  643717713, -373897302,
                -701558691,  38016083, -660478335, -405537848,
                568446438, -1019803690, -187363961, 1163531501,
                -1444681467, -51403784, 1735328473, -1926607734
            ],
            [
                -378558, -2022574463, 1839030562, -35309556,
                -1530992060, 1272893353, -155497632, -1094730640,
                681279174, -358537222, -722521979, 76029189,
                -640364487, -421815835, 530742520, -995338651
            ],
            [
                -198630844, 1126891415, -1416354905, -57434055,
                1700485571, -1894986606, -1051523, -2054922799,
                1873313359, -30611744, -1560198380, 1309151649,
                -145523070, -1120210379, 718787259, -343485551
            ]
        ]
        this.functionArray = [this.ff.bind(this), this.gg.bind(this), this.hh.bind(this), this.ii.bind(this)];
    }

    transpile(string) {
        return this.hex(this.md5(string));
    }

    hex(md5String) {
        let i;

        for (i = 0; i < md5String.length; i++) {
            md5String[i] = this.rhex(md5String[i]);
        }

        return md5String.join('');
    }

    rhex(character)
    {
        let hexString = '', i;

        for(i = 0; i < 4; i++) {
            hexString += `${this.hexTable[(character >> (i * 8 + 4)) & 0x0F]}${this.hexTable[(character >> (i * 8)) & 0x0F]}`;
        }

        return hexString;
    }

    md5(string) {
        let stringLength = string.length,
            state = [1732584193, -271733879, -1732584194, 271733878],
            tail = [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
            i;

        for (i = 64; i <= string.length; i += 64) {
            state = this.md5Crypt(state, this.md5blk(string.substring(i - 64, i)));
        }

        string = string.substring(i - 64);

        for (i = 0; i < string.length; i++) {
            tail[i >> 2] |= string.charCodeAt(i) << ((i % 4) << 3);
        }

        tail[i >> 2] |= 0x80 << ((i % 4) << 3);

        if (i > 55) {
            state = this.md5Crypt(state, tail);

            for (i = 0; i < 16; i++) {
                tail[i] = 0;
            }
        }

        tail[14] = stringLength * 8;

        state = this.md5Crypt(state, tail);

        return state;
    }

    md5blk(string) {
        let md5blks = [], i;

        for (i = 0; i < 64; i += 4) {
            md5blks[i >> 2] = `${string.charCodeAt(i)}${string.charCodeAt(i + 1) << 8}${string.charCodeAt(i + 2) << 16}${string.charCodeAt(i + 3) << 24}`;
        }

        return md5blks;
    }

    md5Crypt(state, unicode) {
        let a = state[0], b = state[1], c = state[2], d = state[3];
        let i, k;

        for (i = 0; i < 4; i++) {
            for (k = 0; k < 16; k +=4) {
                a = this.functionArray[i](a, b, c, d, unicode[this.unicodeArray[i][k]], this.sineArray[i][k], this.tableArray[i][k]);
                d = this.functionArray[i](d, a, b, c, unicode[this.unicodeArray[i][k + 1]], this.sineArray[i][k + 1], this.tableArray[i][k + 1]);
                c = this.functionArray[i](c, d, a, b, unicode[this.unicodeArray[i][k + 2]], this.sineArray[i][k + 2], this.tableArray[i][k + 2]);
                b = this.functionArray[i](b, c, d, a, unicode[this.unicodeArray[i][k + 3]], this.sineArray[i][k + 3], this.tableArray[i][k + 3]);
            }
        }

        state[0] = this.add32(a, state[0]);
        state[1] = this.add32(b, state[1]);
        state[2] = this.add32(c, state[2]);
        state[3] = this.add32(d, state[3]);

        return state;
    }

    ff(a, b, c, d, x, s, t) {
        return this.cmn((b & c) | ((~b) & d), a, b, x, s, t);
    }

    gg(a, b, c, d, x, s, t) {
        return this.cmn((b & d) | (c & (~d)), a, b, x, s, t);
    }

    hh(a, b, c, d, x, s, t) {
        return this.cmn(b ^ c ^ d, a, b, x, s, t);
    }

    ii(a, b, c, d, x, s, t) {
        return this.cmn(c ^ (b | (~d)), a, b, x, s, t);
    }

    cmn(q, a, b, x, s, t) {
        a = this.add32(this.add32(a, q), this.add32(x, t));

        return this.add32((a << s) | (a >>> (32 - s)), b);
    }

    add32(a, b) {
        return (a + b) & 0xFFFFFFFF;
    }
}