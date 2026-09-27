# 学校分布マップ

学校の位置と、H3メッシュごとの学校数を地図上で確認するWebアプリです。学校種別ごとのポイント表示、学校種別フィルター、学校数に応じたメッシュ表示、地図の移動・ズームに対応しています。

## 起動方法

```sh
npm install
npm run dev
```

起動後、ターミナルに表示されたローカルURLをブラウザーで開いてください。

## データと表示

- `public/school.pmtiles` を地図データとして読み込みます。ポイントレイヤーとH3メッシュレイヤーを含むPMTilesファイルです。
- 学校ポイントは学校種別ごとに色分けされ、クリックすると属性を表示します。
- 地図左上のプルダウンで、表示する学校種別を選択できます。初期状態は「すべて」です。
- H3メッシュは `school_count` に応じて色分けされ、メッシュ内の学校数を表示します。
- 背景地図には OpenStreetMap のタイルを使用します。インターネット接続が必要です。

## ビルド

```sh
npm run build
npm run preview
```

## 出典

学校データ: [国土数値情報 学校データ（2023年度）](https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-P29-2023.html)

背景地図: [OpenStreetMap](https://www.openstreetmap.org/copyright)