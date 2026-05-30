// ═══ 20課 ═══════════════════════════════════════════════════════
{
  id: 20, accent: '#0891b2',
  sections: [

    // 問題1 — word box fill-in-blank + reading targets
    {
      id: 's1', type: 'reading_list',
      label: '問題1',
      instruction: '（　）に入る言葉を□の中から選んで書きなさい。また下線部①〜④の読みをひらがなで書きなさい。',
      contextTitle: '語彙選択',
      contextLines: [
        '┌ 訂正・①是正・修正 ┐',
        '(1) 先ほどお伝えしたニュースの中で間違いがありましたので、（　　）してお詫びいたします。',
        '(2) 法案を（　　）する。',
        '(3) 貿易の②不均衡を（　　）する。',
        '',
        '┌ 処置・③措置 ┐',
        '(4) 救急車で応急（　　）をする。',
        '(5) A国がB国に対し、緊急輸入制限（　　）をとったことで貿易の④摩擦が生じている。',
      ],
      questions: [
        { num: 1, target: '是正',   answer: 'ぜせい' },
        { num: 2, target: '不均衡', answer: 'ふきんこう' },
        { num: 3, target: '措置',   answer: 'そち' },
        { num: 4, target: '摩擦',   answer: 'まさつ' },
      ],
    },

    // 問題2 — reading sentences ①〜⑮
    {
      id: 's2', type: 'reading_sentences',
      label: '問題2',
      instruction: '次の文を読んで、下線部①〜⑮の読みをひらがなで書きなさい。',
      sentences: [
        {
          num: 1,
          full: '①天皇 ②皇后 両③陛下は今年の文化④勲章の受章者を⑤皇居に招き茶会を⑥催されました。⑦皇太子、同⑧妃両殿下も出席されました。',
          targets: [
            { word: '天皇',   answer: 'てんのう' },
            { word: '皇后',   answer: 'こうごう' },
            { word: '陛下',   answer: 'へいか' },
            { word: '勲章',   answer: 'くんしょう' },
            { word: '皇居',   answer: 'こうきょ' },
            { word: '催',     answer: 'もよお' },
            { word: '皇太子', answer: 'こうたいし' },
            { word: '妃',     answer: 'ひ' },
          ],
        },
        {
          num: 2,
          full: '京都にある桂離宮は江戸初期に造られた天皇家の⑨別荘です。庭園や建物が当時のままの⑩姿で残されています。',
          targets: [
            { word: '別荘', answer: 'べっそう' },
            { word: '姿',   answer: 'すがた' },
          ],
        },
        {
          num: 3,
          full: '日本で⑪唯一の本格的な洋風⑫宮殿である⑬迎賓館赤坂離宮※は和洋⑭折衷の内部⑮装飾が見事である。',
          targets: [
            { word: '唯一',   answer: 'ゆいいつ' },
            { word: '宮殿',   answer: 'きゅうでん' },
            { word: '迎賓館', answer: 'げいひんかん' },
            { word: '折衷',   answer: 'せっちゅう' },
            { word: '装飾',   answer: 'そうしょく' },
          ],
        },
      ],
    },

    // 問題3 — writing (hiragana → kanji)
    {
      id: 's3', type: 'writing',
      label: '問題3',
      instruction: '送りがなが必要な場合はそれに注意して、下線部の言葉を漢字で書きなさい。',
      sentences: [
        { num: 1, full: 'この小説はたいしゅう向けだ。',
          writingTargets: [{ word: 'たいしゅう', answer: '大衆' }] },
        { num: 2, full: '臓器移植をした患者にきょぜつ反応が現れた。',
          writingTargets: [{ word: 'きょぜつ', answer: '拒絶' }] },
        { num: 3, full: '今、すれちがった人は会社のどうりょうに似ている。',
          writingTargets: [{ word: 'どうりょう', answer: '同僚' }] },
        { num: 4, full: '兄は世界のしへいや硬貨を集めるのが好きです。',
          writingTargets: [{ word: 'しへい', answer: '紙幣' }] },
        { num: 5, full: 'べっそうでパーティーをします。ぜひ、遊びに来てください。',
          writingTargets: [{ word: 'べっそう', answer: '別荘' }, { word: 'ぜひ', answer: '是非' }] },
      ],
    },

  ],
},

// ═══ 21課 ═══════════════════════════════════════════════════════
{
  id: 21, accent: '#ea580c',
  sections: [

    // 問題1 — reading headlines + article ①〜⑫
    {
      id: 's1', type: 'reading_headlines',
      label: '問題1',
      instruction: '次の見出しや記事を読んで、下線部①〜⑫の読みをひらがなで書きなさい。',
      headlines: [
        { text: '①絶滅の②危機にある③幻の鳥を④保護', inverted: true },
        { text: '⑤横綱 初場所で６⑥連覇を⑦狙う',    inverted: true },
        { text: '○○⑧内野手 初の⑨盗塁王に⑩輝く',   inverted: false },
        { text: 'プロ野球パンサーズ　餅つき大会でファンと交流　選手とコーチ、⑪監督も参加してファンと⑫親睦を深めた。', inverted: false },
      ],
      questions: [
        { num: 1,  target: '絶滅', answer: 'ぜつめつ' },
        { num: 2,  target: '危機', answer: 'きき' },
        { num: 3,  target: '幻',   answer: 'まぼろし' },
        { num: 4,  target: '保護', answer: 'ほご' },
        { num: 5,  target: '横綱', answer: 'よこづな' },
        { num: 6,  target: '連覇', answer: 'れんぱ' },
        { num: 7,  target: '狙う', answer: 'ねらう' },
        { num: 8,  target: '内野手', answer: 'ないやしゅ' },
        { num: 9,  target: '盗塁王', answer: 'とうるいおう' },
        { num: 10, target: '輝く', answer: 'かがやく' },
        { num: 11, target: '監督', answer: 'かんとく' },
        { num: 12, target: '親睦', answer: 'しんぼく' },
      ],
    },

    // 問題2 — reading sentences
    {
      id: 's2', type: 'reading_sentences',
      label: '問題2',
      instruction: '下線部の漢字の読みを書きなさい。',
      sentences: [
        {
          num: 1,
          full: '三島由紀夫の『お嬢さん』という小説を読んだことがありますか。',
          targets: [
            { word: '三島由紀夫', answer: 'みしまゆきお' },
          ],
        },
        {
          num: 2,
          full: '表彰台に立った選手たちは、国歌が流れるなかで国旗を見つめた。',
          targets: [
            { word: '表彰台', answer: 'ひょうしょうだい' },
            { word: '国歌',   answer: 'こっか' },
            { word: '国旗',   answer: 'こっき' },
          ],
        },
        {
          num: 3,
          full: 'あの選手はインタビューを受けるとき、髪の毛を触る癖がある。',
          targets: [
            { word: '髪の毛', answer: 'かみのけ' },
            { word: '癖',     answer: 'くせ' },
          ],
        },
        {
          num: 4,
          full: '彼は与えられた任務を、無事、遂行した。',
          targets: [
            { word: '与えられた', answer: 'あたえられた' },
            { word: '任務',       answer: 'にんむ' },
            { word: '無事',       answer: 'ぶじ' },
            { word: '遂行',       answer: 'すいこう' },
          ],
        },
      ],
    },

    // 問題3 — writing (hiragana → kanji), two columns
    {
      id: 's3', type: 'writing',
      label: '問題3',
      instruction: '送りがなが必要な場合はそれに注意して、下線部の言葉を漢字で書きなさい。',
      twoCol: true,
      sentences: [
        { num: 1, full: '取材のため現地におもむく。',
          writingTargets: [{ word: 'おもむく', answer: '赴く' }] },
        { num: 2, full: '日頃から体をきたえる。',
          writingTargets: [{ word: 'きたえる', answer: '鍛える' }] },
        { num: 3, full: '川の水面を魚がはねる。',
          writingTargets: [{ word: 'はねる', answer: '跳ねる' }] },
        { num: 4, full: '今回の作品は前作よりおとる。',
          writingTargets: [{ word: 'おとる', answer: '劣る' }] },
        { num: 5, full: '難しい技にいどむ。',
          writingTargets: [{ word: 'いどむ', answer: '挑む' }] },
        { num: 6, full: '靴下にあなが開く。',
          writingTargets: [{ word: 'あな', answer: '穴' }] },
        { num: 7, full: 'はたを振って応援する。',
          writingTargets: [{ word: 'はた', answer: '旗' }] },
        { num: 8, full: '親の愛情にうえているように見える。',
          writingTargets: [{ word: 'うえている', answer: '飢えている' }] },
      ],
    },

    // 問題4 — multiple choice (circle correct kanji)
    {
      id: 's4', type: 'reading_sentences',
      label: '問題4',
      instruction: '{　} の正しいほうに○をつけなさい。',
      sentences: [
        { num: 1, full: '選挙をきけん {危険　棄権} する。',
          targets: [{ word: '棄権', answer: 'きけん' }] },
        { num: 2, full: '人権をようご {擁護　養護} する。',
          targets: [{ word: '擁護', answer: 'ようご' }] },
        { num: 3, full: 'どう {胴　銅} メダルを獲得する。',
          targets: [{ word: '銅', answer: 'どう' }] },
        { num: 4, full: 'かんせい {完成　歓声} が上がる。',
          targets: [{ word: '歓声', answer: 'かんせい' }] },
        { num: 5, full: '空をとぶ {飛ぶ　跳ぶ}。',
          targets: [{ word: '飛ぶ', answer: 'とぶ' }] },
        { num: 6, full: '我がチームのけんとう {健闘　検討} を祈る。',
          targets: [{ word: '健闘', answer: 'けんとう' }] },
      ],
    },

  ],
},

// ═══ 22課 ═══════════════════════════════════════════════════════
{
  id: 22, accent: '#0d9488',
  sections: [

    // 問題1 — reading sentences ①〜⑪
    {
      id: 's1', type: 'reading_sentences',
      label: '問題1',
      instruction: '下線部の読みをひらがなで書きなさい。',
      sentences: [
        {
          num: 1,
          full: '父は輸入業者から仕入れた商品を小売店に卸す仕事をしています。',
          targets: [
            { word: '輸入業者', answer: 'ゆにゅうぎょうしゃ' },
            { word: '小売店',   answer: 'こうりてん' },
            { word: '卸す',     answer: 'おろす' },
          ],
        },
        {
          num: 2,
          full: '自動販売機で飲み物を買う場合、小銭が必要です。',
          targets: [
            { word: '自動販売機', answer: 'じどうはんばいき' },
            { word: '小銭',       answer: 'こぜに' },
          ],
        },
        {
          num: 3,
          full: '浅草の浅草寺は７世紀に勝海という僧によって整備された。',
          targets: [
            { word: '僧',   answer: 'そう' },
            { word: '整備', answer: 'せいび' },
          ],
        },
        {
          num: 4,
          full: '江戸時代の庶民の娯楽について書かれた研究書が出版された。',
          targets: [
            { word: '江戸時代', answer: 'えどじだい' },
            { word: '庶民',     answer: 'しょみん' },
            { word: '娯楽',     answer: 'ごらく' },
            { word: '出版',     answer: 'しゅっぱん' },
          ],
        },
        {
          num: 5,
          full: 'A社とB社が合併して、世界最大の鉄鋼メーカーが誕生した。',
          targets: [
            { word: '合併', answer: 'がっぺい' },
            { word: '鉄鋼', answer: 'てっこう' },
            { word: '誕生', answer: 'たんじょう' },
          ],
        },
        {
          num: 6,
          full: '学生を６つの班に分けて、討論を行った。',
          targets: [
            { word: '班',   answer: 'はん' },
            { word: '討論', answer: 'とうろん' },
          ],
        },
        {
          num: 7,
          full: '私は両親と妻を扶養している。',
          targets: [
            { word: '扶養', answer: 'ふよう' },
          ],
        },
        {
          num: 8,
          full: '光沢が出るまで、革の靴を磨く。',
          targets: [
            { word: '光沢', answer: 'こうたく' },
            { word: '革',   answer: 'かわ' },
          ],
        },
        {
          num: 9,
          full: '車掌は安全を確認した上でドアを閉めた。',
          targets: [
            { word: '車掌', answer: 'しゃしょう' },
          ],
        },
        {
          num: 10,
          full: 'C社は、来月上旬に最新のエンジンを搭載した車を発売する。',
          targets: [
            { word: '上旬', answer: 'じょうじゅん' },
            { word: '搭載', answer: 'とうさい' },
            { word: '発売', answer: 'はつばい' },
          ],
        },
        {
          num: 11,
          full: 'プールで潜水の練習をした。',
          targets: [
            { word: '潜水', answer: 'せんすい' },
          ],
        },
      ],
    },

    // 問題2 — writing (hiragana → kanji)
    {
      id: 's2', type: 'writing',
      label: '問題2',
      instruction: '送りがなが必要な場合はそれに注意して、下線部の言葉を漢字で書きなさい。',
      sentences: [
        { num: 1, full: '夏がしゅんのこの魚はあなにもぐっているためアナゴと呼ばれる。',
          writingTargets: [{ word: 'しゅん', answer: '旬' }, { word: 'あな', answer: '穴' }, { word: 'もぐっている', answer: '潜っている' }] },
        { num: 2, full: 'この古墳は一体だれのはかなのだろう。',
          writingTargets: [{ word: 'はか', answer: '墓' }] },
        { num: 3, full: '大型の船、１せきの値段はいくらぐらいですか。',
          writingTargets: [{ word: 'せき', answer: '隻' }] },
        { num: 4, full: 'クレジットカードでばかり買い物をしているときんせん感覚が鈍くなりそうだ。',
          writingTargets: [{ word: 'きんせん', answer: '金銭' }] },
        { num: 5, full: '忙しいけれど、じゅうじつした毎日を送っています。',
          writingTargets: [{ word: 'じゅうじつした', answer: '充実した' }] },
      ],
    },

    // 問題3 — multiple choice (circle correct kanji)
    {
      id: 's3', type: 'reading_sentences',
      label: '問題3',
      instruction: '{　} の正しいほうに○をつけなさい。',
      sentences: [
        { num: 1, full: 'しんじゅ {真珠　真珠} の指輪',
          targets: [{ word: '真珠', answer: 'しんじゅ' }] },
        { num: 2, full: '昆虫を捕るあみ {綱　網}',
          targets: [{ word: '網', answer: 'あみ' }] },
        { num: 3, full: '情報化社会のへいがい {幣害　弊害}',
          targets: [{ word: '弊害', answer: 'へいがい' }] },
        { num: 4, full: 'はんけい {半径　半経} ３センチの円',
          targets: [{ word: '半径', answer: 'はんけい' }] },
        { num: 5, full: 'テレビのごらく {誤楽　娯楽} 番組',
          targets: [{ word: '娯楽', answer: 'ごらく' }] },
        { num: 6, full: '国際線のとうじょう {塔乗　搭乗} ゲート',
          targets: [{ word: '搭乗', answer: 'とうじょう' }] },
      ],
    },

  ],
},
