import fetch from "node-fetch";
import fs from "fs";

const username = process.env.GH_USERNAME;

// GraphQLで草取得
const query = `
query {
  user(login: "${username}") {
    contributionsCollection {
      contributionCalendar {
        weeks {
          contributionDays {
            contributionCount
            date
          }
        }
      }
    }
  }
}
`;

const res = await fetch("https://api.github.com/graphql", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${process.env.GH_TOKEN}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ query }),
});

const json = await res.json();

const weeks =
  json.data.user.contributionsCollection.contributionCalendar.weeks;

// flatten
const days = weeks.flatMap(w => w.contributionDays);

// SVGサイズ
const cell = 12;
const width = weeks.length * cell;
const height = 7 * cell;

// パックマン位置（時間で動く）
const t = (Date.now() / 1000) % days.length;
const pacIndex = Math.floor(t);

// SVG開始
let svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
<style>
  .grass { fill: #2ea043; }
  .empty { fill: #161b22; }
  .pac { fill: yellow; }
</style>
`;

// 草描画
weeks.forEach((week, x) => {
  week.contributionDays.forEach((d, y) => {
    const intensity = d.contributionCount;
    const fill = intensity > 0 ? "#2ea043" : "#161b22";

    const index = x * 7 + y;

    svg += `<rect x="${x * cell}" y="${y * cell}" width="${cell}" height="${cell}" fill="${fill}" />`;

    // パックマン
    if (index === pacIndex) {
      svg += `<circle cx="${x * cell + 6}" cy="${y * cell + 6}" r="5" fill="yellow" />`;
    }
  });
});

svg += `</svg>`;

fs.writeFileSync("pacman.svg", svg);
