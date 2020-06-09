import L from '../../common/logger';
import * as diff from 'diff';
import Nedb from 'nedb';
import csvtojson from 'csvtojson';
import nodemailer from 'nodemailer';
import axios from 'axios';
import path from 'path';
import xssFilters from 'xss-filters';

const transporter = nodemailer.createTransport({
  service: 'Zoho',
  host: this.service,
  port: 587,
  secure: false,
  auth: {
    user: process.env.BOT_EMAIL_ADDRESS.toString(),
    pass: process.env.BOT_EMAIL_PASSWORD.toString(),
  },
});

const db = new Nedb({
  filename: path.join(__dirname, '..', '..', '..', '..', 'pages.db'),
  autoload: true,
});

const urls: string[] = [];

csvtojson()
  .fromFile(path.join(__dirname, '..', '..', '..', '..', 'url.csv'))
  .then((urlsJQ) => {
    console.log(urlsJQ);
    db.find({}, (err, docs) => {
      if (err) {
        throw err;
      }

      for (const urlJQ of urlsJQ) {
        urls.push(urlJQ.URLs);
      }

      for (const doc of docs) {
        if (urls.indexOf(doc.url) === -1) {
          db.remove({ _id: doc._id });
        }
      }

      for (const url of urls) {
        db.update({ url }, { $set: { url } }, { upsert: true });
      }
    });
  });

export const run = (): string => {
  L.info('/crawler/run/');

  const patches = [];
  const updatedUrls = [];

  db.find({}, async (err, docs) => {
    if (err) {
      throw err;
    }

    for (const doc of docs) {
      let res;
      try {
        console.log('checking...', doc.url);
        res = await axios.get(doc.url);
      } catch (err) {
        transporter
          .sendMail({
            from: process.env.BOT_EMAIL_ADDRESS.toString(),
            to: process.env.DEVS_MAIL_LIST.toString(),
            subject: process.env.SUBJECT.toString(),
            text: 'Please use the email client of using HTML render.',
            html: 'Some URL has been deleted or went wrong. Check the page.',
          })
          .then((info) => {
            console.log(info);
          })
          .catch((err) => {
            console.log(err);
          });
        console.log(err);
      }

      if (!('html' in doc)) {
        db.update({ url: doc.url }, { $set: { html: res.data.toString() } });
        continue;
      }

      if (res.data.toString() === doc.html) {
        continue;
      }

      // updated url will add pato emoji
      updatedUrls.push(doc.url);
      patches.push(diff.diffLines(res.data.toString(), doc.html));
      db.update({ url: doc.url }, { $set: { html: res.data.toString() } });
    }

    console.log('updated urls', updatedUrls);

    if (patches.length === 0) {
      return;
    }

    let html = '<ol>';
    for (const url of urls) {
      if (updatedUrls.indexOf(url) !== -1) {
        html += '<li>🚨 <a href="' + url + '"></a>' + url + '</li>';
      } else {
        html += '<li>✅ <a href="' + url + '"></a>' + url + '</li>';
      }
    }
    html += '</ol>';
    // For user
    transporter
      .sendMail({
        from: process.env.BOT_EMAIL_ADDRESS.toString(),
        to: process.env.USERS_MAIL_LIST.toString(),
        subject: process.env.SUBJECT.toString(),
        text: 'Please use the email client of using HTML render.',
        html,
      })
      .then((info) => {
        console.log(info);
      })
      .catch((err) => {
        throw err;
      });

    for (let i = 0; i < updatedUrls.length; i++) {
      html +=
        '<div style="border: 1px;"><a href="' +
        updatedUrls[i] +
        '">' +
        updatedUrls[i] +
        '</a><pre>' +
        xssFilters.inHTMLData(JSON.stringify(patches[i], null, 2)) +
        '</pre></div>';
    }
    //For developers
    transporter
      .sendMail({
        from: process.env.BOT_EMAIL_ADDRESS.toString(),
        to: process.env.DEVS_MAIL_LIST.toString(),
        subject: process.env.SUBJECT.toString(),
        text: 'Please use the email client of using HTML render.',
        html,
      })
      .then((info) => {
        console.log(info);
      })
      .catch((err) => {
        throw err;
      });
  });

  return '/crawler/run/';
};
