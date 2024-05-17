import axios from "axios";
import * as cheerio from "cheerio";
import fs from "fs";
import { json2csv } from "json-2-csv";
import { functionOptimizeImages } from "images-folder-optimizer";
import sharp from "sharp";

const amp_urls = [
  "https://www.alpine-usa.com/product/s-series-amplifier-s2a120m",
  "https://www.alpine-usa.com/product/s-series-amplifier-s2a60m",
  "https://www.alpine-usa.com/product/s-series-amplifier-s2a55v",
  "https://www.alpine-usa.com/product/s-series-amplifier-s2a36f",
  "https://www.alpine-usa.com/product/r-series-amplifier-r2a150m",
  "https://www.alpine-usa.com/product/r-series-amplifier-r2a75m",
  "https://www.alpine-usa.com/product/r-series-amplifier-r2a60f",
  "https://www.alpine-usa.com/product/r-a90s-6-channel-amplifier",
];

const subwoof_urls = [
  "https://www.alpine-usa.com/product/s-series-subwoofer-s2w12d4",

  "https://www.alpine-usa.com/product/s-series-subwoofer-s2w10d4",

  "https://www.alpine-usa.com/product/s-series-subwoofer-s2w8d4",

  "https://www.alpine-usa.com/product/r-series-subwoofer-r2w12d4",

  "https://www.alpine-usa.com/product/r-series-subwoofer-r2w10d4",

  "https://www.alpine-usa.com/product/r-series-subwoofer-r2w8d4",

  "https://www.alpine-usa.com/product/r-series-shallow-subwoofer-rsw10d4",

  "https://www.alpine-usa.com/product/r-series-halo-subwoofer-r2sb12v",

  "https://www.alpine-usa.com/product/s-series-halo-subwoofer-enclosure-s2sb12v",
];

const speaker_urls = [
  "https://www.alpine-usa.com/product/s-series-speakers-s2s65c",

  "https://www.alpine-usa.com/product/s-series-speakers-s2s65",

  "https://www.alpine-usa.com/product/s-series-speakers-s2s69c",

  "https://www.alpine-usa.com/product/s-series-speakers-s2s69",

  "https://www.alpine-usa.com/product/s-series-speakers-s2s50",

  "https://www.alpine-usa.com/product/r-series-speakers-r2s652",

  "https://www.alpine-usa.com/product/r-series-speakers-r2s65",

  "https://www.alpine-usa.com/product/r-series-speakers-r2s69c",

  "https://www.alpine-usa.com/product/r-series-speakers-r2s69",
];

async function get_products() {
  let product_data = {
    rows: [],
  };
  return Promise.all(
    subwoof_urls.map(async (url) => {
      const response = await axios.get(url);

      const html = response.data;

      const $ = cheerio.load(html);

      const modelName = $(".productHero__copy__container .productHero__name")
        .first()
        .text();

      const modelCopy = $(".productHero__copy__container .productHero__copy")
        .first()
        .text();

      const wooProductName = `Alpine ${modelName} ${modelCopy}`;

      const productSpecCopy = $(".productSpec__overview .productSpec__copy")
        .first()
        .text();

      let images = [];

      let description = productSpecCopy + "\\n\\n";

      $(".productHero__image").map((i, el) => {
        const img = $(el).find("img").attr("src");
        images.push(img);
      });

      $(".productSpec__buckets__container").map((i, el) => {
        const img = $(el).find("img").attr("src");
        const header = $(el).find(".productSpec__header").text();
        const copy = $(el).find(".productSpec__copy").text();
        images.push(img);
        description += `<h3>${header}</h3>\\n<p>${copy}</p>\\n\\n`;
      });

      $(".productApps .productApps__content").map((i, el) => {
        const img = $(el).find("img").attr("src");
        const header = $(el).find(".productApps__header").text();
        const copy = $(el).find(".productApps__copy").text();
        images.push(img);
        description += `<h3>${header}</h3>\\n<p>${copy}</p>\\n\\n`;
      });

      let data = {
        Type: "simple",
        Published: true,
        Name: wooProductName,
        Description: description,
        "Visibility in catalog": "visible",
      };
      //console.log(data);

      product_data.rows.push(data);

      try {
        images.map((img, i) => {
          let image = axios
            .get(img, { responseType: "arraybuffer" })
            .then((res) => {
              if (!fs.existsSync(`./images/${modelName}`)) {
                fs.mkdirSync(`./images/${modelName}`, { recursive: true });
              }
              fs.writeFileSync(
                `./images/${modelName}/${modelName}_${i}.jpg`,
                res.data
              );
            })
            .catch((err) => {
              console.log("failed on images", err);
              console.log("model name", modelName);
              console.log(err);
            });
        });
      } catch (err) {}
    })
  ).then(() => {
    return product_data;
  });
}

// get_products().then((data) => {
//   const csv = json2csv(data.rows);
//   fs.writeFileSync("products.csv", csv);
// });

export async function resize_images() {
  if (!fs.existsSync("static/images/optimized")) {
    fs.mkdirSync("static/images/optimized", { recursive: true });
  }

  functionOptimizeImages({
    stringOriginFolder: "images/",
    stringDestinationFolder: "static/images/optimized",
    objectResizeOptions: {
      width: 900,
      height: 600,
      fit: sharp.fit.cover,
      strategy: sharp.strategy.entropy,
    },
    arrayOriginFormats: ["jpg"],
    arrayDestinationFormats: ["jpg"],
  }).then((results) => {
    console.table(results);
  });
}

resize_images();
