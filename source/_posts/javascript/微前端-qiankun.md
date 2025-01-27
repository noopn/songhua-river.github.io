---
layout: posts
title: 微前端 ④ qiankun
date: 2024-08-10 15:32:30
categories:
  - JavaScript
tags:
  - 微前端
  - qiankun
---

#### 什么是 qiankun

qiankun 是一个微前端的解决方案，对 single-spa 进行了封装。

#### 执行流程

<iframe width="100%" height='500'  src="https://drawio.iftrue.club:9348//?tags=%7B%7D&lightbox=1&highlight=0000ff&layers=1&nav=1&title=qiankun-microfe.drawio#R3V1Zc%2BPGEf4teUBV8iAVDoIEHgGKtJN4Y9VqK4n9koJISIINElwA8kr%2B9ZnpOTBHAwQlUqLWtVUmR8AcPd093V93D51gvnn6oc52D5%2BqdV46vrt%2BcoIrx%2Ff9qTsj%2F6Mtz6zFm04mrOW%2BLta8rWu4Kf7MeaPLWx%2BLdd5oD7ZVVbbFTm9cVdttvmq1tqyuq2%2F6Y3dVqY%2B6y%2B5zq%2BFmlZV263%2BKdfvAWqPQ7dp%2FzIv7BzGy5%2FK%2FbDLxMG9oHrJ19U1pChZOMK%2BrqmWfNk%2FzvKTUE3Rh7y17%2FionVufbdswLv%2F56%2Fc%2FncJtt2h9u%2Fvvl631Zxf%2B68CM%2BufZZrDhfEwLwr1XdPlT31TYrF11rWleP23VOu3XJt%2B6Zn6pqRxo90vhb3rbPfDezx7YiTQ%2FtpuR%2FJTOun%2F%2BrfvmFdnY5C8X3qyfeO%2Fv2zL81bV39ns%2BrsqphsgH9b0lWnK6z5gGmRLu0ScOp1VSP9SofoIdgsay%2Bz9shuk3Zg5RYygic8j%2Fk1SYn8yYP1HmZtcUfOjdlnCnv5XP81aSus2flgV1VbNtG6fmaNpAHuICFEWcuLl6hH6g8QD6wHsU3ZWpdE%2FDJATzDF%2FFHVj7yZd38%2Fb7ML252mcVMHavQffn2ULQ5eQy24BvRGDpb9G7bH3nd5k%2BDdBYEmekEEWrkWye7nhDIB0VuA7d%2FZxRqHk4sviEqtd5V4txL1%2FV1qfNm8R6xg2%2FXeV0QmuQ1b3y5kPkjhcw7upC9biutnfxaZNvfH7fvzvW%2BwfQ%2BwvXem3J9%2BC5M%2FlS0jMdD%2Fu0X5S8db9MvGmsrL0mx2CMSrzhipmPPmMlZsb%2BY95Ama74VmzLb5nBUZ3XLt4oSjHJzQeyqpCzut6StrUAOqrr4s9q2mdjDjP%2B5zO%2FaIwmHIR2xLRzBBBEOfzIgHXy0z8TkzLbk8FOGM06gABHGEBnOHC0riardZm2eUrForO07xkE%2BQ3Z0WlK6V6W2sdOvj9RMTW%2Brep3XFytmgCXwbv3Xiwu1%2FW%2BwbeIN8ume%2Fx86Lotjd7yInchzoitnETrRwomm8GHmpImzmDrx3EngQxo4SQR%2FmjrR3FnMnDhxogltIU%2FGE2iZ0Gf4TAlJ6WT16ZNGShrR2Kv33f163%2BB0Uz42xXoNatEWgWHxHC0Ys8tQ59TIYlQ%2F8sVDmmj4p9Ixsc2RyN7ZW0am8rxdiV26rc19UzetY0TBQZGTuk4UqCyQbeh2bW%2BbHbzjitfuKrC%2FV9IF6fgRnJG7O5tFm4KqiIuG2MeLiZNGTnIFWvu%2BaIiMJ7tdSTa%2BLaqtwmVsHDllYzrGd5REZBCi6g5jb5UoM9pDFEMPRKxCYHWi0ykxqGCRMWM%2BchxSGia%2Bk8BcyEvJDFo8mMvSSefkw1V%2Bl9fXdbUpmhw6IR2TOQYw6xgkGKiTJrt8uyY0c%2Fw5NF056VLOX3RAp0AE2Ie3PSrnSH%2F2NKXYW9O0eYdolphMB1iQ0CLx95AgBG3DdoHMZQqTT%2BljmraZw6xZlyE8Q%2F6U8of5W4xHxu3UCM68u5tObwObM8sqWxP%2B6%2BU72KQocRIXhOSK%2FhtgLdoSwxIiumUxrDcmFFgMviWJAy3xEt7y%2BFjkA30GNDn7E9XtbG9DKrec2h7dnE7QfBcV63PQ7MzyeTO1PrPtjx617k1P5Q94kaXXhfr7VKzqivBgY9GcrLfFCbsiNKN%2BaP%2BhWedN8Wd2WwrrkwMppN8wdcIr2hdxHxpmnnoWsrStwIa9K8rSaDrZtnm62WifxW%2BLW3g2yvMeLp0G61HdhGF%2FZXablylYitif%2B0HDVzhxI304YdAcGSe0gMCpwT6%2Ba5hobKb8rY43DgYcJ8Y4odrb%2Fsf5tE6KTwq%2F%2BYWO6glczgDRwbjP6Z4MkcG89xG2sWVqmvaY%2BUSdf33Mm%2FbvRA%2FPs7K8zVa%2FSwuwM5GMs%2FquqJv2YkO0BbOtbJtIunTkw5IaBbQrlzp8XecxNdGYkWXbLKbRETiRSw0xxOwjpsqU22jEconn3CLjBiV5fQnm45zanQg92Pzn1HZktkkUoY9dV037KW8aGoGiLxFrk1mtsFBqmsqVgfUTucqikf6avP1SbPLqsR1t4xMjFOhAbdiQEpwwfl09PQsDN4K1wqCEJMjq%2BQxX1bZpD31J2Qy23wuMBmQzJsI4dKl3M3ZttvV3LCeOrlPYrIpH0GNEI46Csq%2BESyPmhCzofH3X8pK4TwRnRFOV5Ij4gGas1MkvxbQniAZ1EQ3qhSfToAhaxrl8KVSOHU39yEbsyzdtD9Z5MqtVdPxRw9nL5XRKdMSrgmvxu5mmrxMvBPp7W6tt5uoqBwkUhFgULTyZygnskOM4QBOxDorNjrD2BWXbC%2BBCcYwZJ3BET11iFXDjR%2BArSchNryQAzmenGj26LNiqw3MisCoAbKPml%2Fuas5sw8%2BIJQiLlzaoudtRLsVFa8iZZRDoTduKUA33MxqFGVKyBccS2oM%2FEdDBKBmvG6lmd%2BhQq7PqReN9%2BmmH0Ii0zbtuS1aYesmx1qmRdHBpLwbaVlpZi%2F3IrMQID1tMwXD5VsDgYfehbS2zJEspFsb8Fpwaxag%2FYUbCCY%2FhAl58Im1oYODRIE1H6JAkfJWbPxNqW%2Be66%2BIPjktRiYkuLO9SVUS%2BdwLQVtyMF2xHdKW5R8yEYdzMcPVSGmQI%2F%2BfrWRh0AqQ0sRUHOACRSuhLMkdkPiDKqMbrPwCEKaW%2BMrVOBTRO24Ki3MWd99GiqMA2MlXqK4DMXYMlpFEUKZRWBNsknQX65Lj4o0JF5BNzGBWZMF1wCpHAQFhOCDFzzl6uf519%2BuV5QLQt98D9KRuIQs%2FTJmLOVaExu7lVMp5nChxiQ%2FG7fgSQpMEACxBhwDcdzu%2B60rJqGK5AYmJnuj6cFI6SLQMkZIUNzngqFCDN5F4xD5D1l%2FhxsiJRusgEQTR0lgCJH8TPNSeQBGiE2vZJpyiGVz35hUQYwwxyGB76AqEFMR%2BX6xgV%2F0FZgNhmWgiOs0DBdYp63l2RDPj%2BWeaN5WLTvJXRp6yZMb1IxkULK%2FLsZjK%2Fozb0abQGHU8Q0DBELVaPp8psueSwung2eahiFiHai6ltqdvCzY8EW7BDiwjMwH6nWhsGTJfCDqlisg9PUVHzyzNZDVIZNiR746dNjC6HUn2%2BbvCa2n7By0g4zSvTwqKm7Aa9gDE2ZWI1qWViESYgRimGURI05GKxp951PkBzdZsWWU6NvF0egRWZkd2CqLALoag9HAtuRrE8mnOhLNqN79hlusUB3Euv04RFJjyNnfDdjOkQk7SYpZrFAqHzN3oGevxVbmrvN9YJ9RBxs%2FvyGnQeoNJGFJhCNj0Ku%2F8xTRFCIW0UTfhZyDTqB6H2H7PUOu3cNJt2%2FFcQtwpnCsqojNiuWjzPHdtVel9QkEf2aePykT1TzGjOr7J03%2B5Gj22Fqe6qQZ5BOuHlNLa6D4tUW%2BvdScnOQkNoukJcQCQOKKTbKmIF%2BCuimAGIB2LRSlkbYnHkplNM9vi%2BJdzgQy7YY3BuKNocvpBvj5DiVsQOab464TFasYUhL2RLPHBsWcbiiVFX%2FxB02pkJkfolrS4FIrDCO%2BZT5tgvYMym3iJlp5vu8FPB9S4g3PhRw8Yz8MxtvmURImoIEYY6Pt9hBb5kh8xFwXSNAvh9NPAAcMzYrshMUZm%2BK9E7eFel1L2OiC%2FQyiuketBetohA56xeyMIOnrZPvhMaDqevki9mdhSjH8XIZUB44UoFUEIyElwV2eSbwcjCiDue08LIXeHvx5QmWFDA9nRC9MCkAw5fv8nb1wCFYam8xU5WchT5DmzszTD2FOaingEUGSnqwY2XjrKpTYLidChJFTQTmcc4hbD0R%2BJoN0qjQqW4%2Bvty2Y%2BmggYImYFBl7yQHsD9JmYPQbtlhBNm1E9wyjpbCa1sKmyni9hB33wAQoUP0oz0vJRrjOCTXAoWtxdLjAAAFGyRRCRZ3uDxHjTWO5suK5eb0ALwmCe1Be712BkMfmAmM%2BCqSw5nriqYjhHQGfOUeeEESbetsblnr5mLsKxA3a3fbfLMj%2Bj1nMGS%2Buc3XP3759BMAk1cGtisdWA1iMQF6VV2MCLNYM8qaJm%2BvH2%2FLYnVNa7TRXP%2BTNqELt2URHBCONC7oPx%2F0HEX7RX4NecBnqfqpyEIAMliLVqNn9MC7oShoMzAZM4pmK48BvLEv7ofPpz%2Bad7Sm1y%2FS1n77F5k%2F5au3WN07cayN%2FNhEss6lw9T%2FmWYzSWPymNlMMWL6nTC1ILRMP5YhsNiK7s%2Fe3T2KUW5Wh9p%2BbXQiv7Z8%2Bt%2Fnjfvp87%2F%2FdZ38HP%2F8j2RShxcjcpffwM8d5R%2Bi80cS49HngvfyDodmraX2sZBxzKNHyUJEj9RkPzP1eV9Jy0Ea6xjsbdwPEoe24vFmCMZ2jEoglNL9GU0PnmbHCqQ1hggXywcmJmd3MCjP88ad5iukPYF%2FO3FCif%2F2DasFIBeQkjEFJ8yIUxgmnJ5ppJm1LN2C4epgmHcr2%2FWeeLYaHqsrG8JmtKQyuAq7b19AHVz4fcxYEU67K%2BHSogeizfOtpVuOwKN%2BYCCL2J0t2OEoC6KOzqSz99C5HbboaLjiviTSl%2BtqBMpDn4uOravxYqHIVFaRsb9HqmGSeJoxTl8Rk%2Fl8NHENDntdERN%2BImHZ5hF1V7TsLUgHo7onBvDjCgc%2FzApwhLl%2FojV0p7PwbCYdEjxLecj73fggjnqFGqZU3EsvFAEpvm3ikH8ll4puREXbTO%2Bgurtr8tYxNdAROMIGsLtadMsy4Wda2h0vjA2ipe2BYRVbLGsmieFYZKehr52P4yutDgxJHv18mRjnC2oDYbW1J7OBbNerL8qoRCRObyya%2Be8zhFARdhDHs1NRSpgCZ%2BcODe3r3nM3GnnuvluBxtCstQOpt85gISsM0Nz4mZopPC5jiOHXI5F7GZkQ%2BPVwTKB3UDQJRUyDdJsyCN%2FIKMaBagMHO65nOKhnRmsAw9CZIooSA0NOpig9zFv88OKPFGjhq%2FfOSv7t%2BiwMxO%2B7MWafqB3ZSjiJPHhIxB4ViGOgtjhLnCs8%2BCqB8MaCht6ZoYYYbGjXqyPZDf3xEa3mXz9gKI9la6e3piYSVR0xtIQAeE0GU82tfs5SDI1LRAKRiqaK4fRNz6URV2F%2BQDEciwcJ%2Bp%2BLGCKpXYpBOiB9Mg9ZVDPSFnHNGM%2BfH0wePqAEr7%2BIxHdpeZjMq4jVizFkuF%2BtmYBMbOaDx2iVkHInCNRbXVUbtFhW5Dqzz2bx0gwKnIy6nbnI85HXdEDJ6UfQG5NwpN4QScfH59QRNe4fCml%2Bnb4Jx%2BqbNwKgfQOAtgIMPQD00TBfGxjS0%2FcGqhjseldfKBko31tYFWNItRGm0HqvEf0AEj%2FFQklvaimcyfX%2Fx5bcsQiWWO2ZWArIzXBQFPcfVt6Hbcx5xEX8voSjgwMjF%2B6l584mmpi8NjJy%2BtgHcn8oVs82pqLSrvjqzV31LptinS%2Fu7gh9m8%2F57WNRrvO6EaaTkfymFoUtQPcqrhwxoxLpHF6NmalvWmy7rF09JO0nekkeXI7s9haiUc0N8%2BoSfz3tnhD%2BFpirrHLdLFJ0sx29hXn%2BQNbs8GgQu0qkvxvfXVerx02%2Bbe3lBJfmelDa9q0PioJZDs7AjRg8OqUm%2FMcQFrMMa2t%2BE308SRn7JkK7mHzggjeWkJsMFtwPHOyDVySY5Ym9fIwxoL1SNVfFqJeVCeIDK7VLaW2BGKzupoRaaiUZ3W0eVo2mWYgpVMCIWsrX2C0vTCI9jnFjmqeYdSNrjLREmfhk5s13CYSIRew3b84LCBHzNtIYLS2tqfZ5sW0IC6b5XVXnuqbvK103rvvovwzevEbV9lPslDn7EqvBm5eGfKJYXJk6V3P5AUQd1qwUl5krasaEbHquKWlW1S7ncI5Whp52l0KlCbx8QSP%2B8nYSSW%2B%2BUPVKNXG1Ec%2FrkOX4JlX6rk6xFthAqMbBa07kgOrPOaT8HteIXYVjQ1r8YVEitJA%2FR8GYL1Fio%2Ba0GaQ959PZWz7AyujZBMl5Q3qn6q99wG2yj6vrA883rvGfuLa2F9dv69r%2BZLnpPmKFfwfafiwMJVK9zkXbY2jRoE2O%2FmhJr9W4qvOszRdlDi%2FzW8TEPcUL9lsrzEwLQC2ApcxTLewrlcSl0PYvtNjXvphunbRMVdfD4%2FdhdWmPxqDKLYZpKNJMQn551t5BLXJ8fczr55u8JP5KVStXjM3oSvjVbQuu6%2BwIYH%2FgDqA2dhQSCiW2RB2jrumtwuXmjwMgKgu7D9hM9D2ajAhV%2BJ1prNlYjXVeGWToDdo2kCI9QAgudSi0fv%2FZsTNKzliOPCQR62T3auNyhHgW34Ecjc3ECs4rEwu7Khs5NrHbvfZe6mWjPwaAQigl6ttuWmIgJCt63aJd6vZxxQ37wawxv9h5PGn7LrO8hBDtl7bzyvJCLgXrfqjGutUNCSII39a%2BbGD8rXQz%2BhUrn%2FcvhV0pfsiFm5P9fajmOP%2BNFnnASrCkF77oCTr0IbQD05CQbySup53AbZfMKJ6Y6TO9v8ljT17eobPfrA84%2BcYHvhFXQ78NhmZ%2B4%2BEFjE774kAhCm3cAlwHsZIfq%2Br3RkAo6A2m%2B25CtcakLkvH4wOkUCNcY6%2BG7Trejy%2FOnC55Xi25PWi%2FjBBFrPXDJYHduz3lO5hO8RVJDMscfeCKKeXHjuigc%2BAS%2FtOfym3OZo%2FKRe2JWgDBVhjxn0aSr8fs5iMhHB%2F3MDaLLTHTN0AO4xOexnYKx%2BP24BNAfWVYtxhRvRF3pWKxY21AW8t8N%2Fwxwaw1lEFeEAQjX2t6Vb2Sy0Bo8%2FCpWtOckMX%2FAQ%3D%3D"></iframe>

#### CSS 沙箱如何实现

strictStyleIsolation 严格模式， 通过 ShadowDOM 实现,将子应用最外层的元素升级为 ShadowDOM

```js
var containerElement = document.createElement("div");
containerElement.innerHTML = appContent;
var appElement = containerElement.firstChild;
if (strictStyleIsolation) {
  if (supportShadowDOM) {
    var innerHTML = appElement.innerHTML;
    appElement.innerHTML = "";
    var shadow;
    if (appElement.attachShadow) {
      shadow = appElement.attachShadow({
        mode: "open",
      });
    } else {
      shadow = appElement.createShadowRoot();
    }
    shadow.innerHTML = innerHTML;
  }
}
```

另一种是开启了 experimentalStyleIsolation 实验性沙箱配置，原理是尝试通过遍历 sheet 样式表的每一条样式，为每条样式添加一个私有化的选择器

```js
// 给子应用的最外层元素设置一个私有属性，用于添加选择器
// css.QiankunCSSRewriteAttr 默认私有化属性  data-qiankun
// appInstanceId 子应用的 name 属性
appElement.setAttribute(css.QiankunCSSRewriteAttr, appInstanceId);

// 创建私有化的选择器 prefix =>div[data-qiankun="setting"]
var prefix = ""
  .concat(tag, "[")
  .concat(QiankunCSSRewriteAttr, '="')
  .concat(appName, '"]');

// 获取并便利所有的 style 标签
var styleNodes = appElement.querySelectorAll("style") || [];
_forEach(styleNodes, function (stylesheetElement) {
  // 创建新的style标签，并将当前style中的样式复制到新标签中
  var styleNode = document.createElement("style");
  styleNode.appendChild(
    document.createTextNode(stylesheetElement.textContent || "")
  );

  // 获取 CSSStyleSheet 对象，并将 cssRules 转为数组, 遍历并重写规则
  var sheet = styleNode.sheet;
  var rules = arrayify(sheet.cssRules);
  var css = "";
  rules.forEach(function (rule) {
    switch (rule.type) {
      case RuleType.STYLE:
        /**
          1 对于 html body :root 几个根元素
            会直接用 prefix 替换掉，防止对基座应用样式污染

          2 html + body 格式的演示qiankun认为是非标准的样式不做处理

          3 html > body html body 性质的选择器会将 html 替换为空字符串

          4 检查 a,html or *:not(:root) 根元素前插入了其他字符的选择器
            同样需要替换为 a,[prefix] *:not([prefix]) 的形式
          
          5 其他选择器会在选择器前添加前缀 
            [prefix] .text {}
          
          最后拼接字符串
         */

        css += ruleStyle(rule, prefix);
        break;
      case RuleType.MEDIA:
      case RuleType.SUPPORTS:
        /**
           媒体查询 @media screen and (max-width: 300px) {}
           能力检测 @supports (display: grid) {}

           会递归调用重写方法，将中间的选择器重写
         
         */
        css += ruleStyle(rule, prefix);
        break;
    }
  });
});
```

#### js 沙箱

##### 快照沙箱

如果平台不支持 Proxy ,则使用快照沙箱。 通过记录 window 对象上的属性变化，会复或保存状态。

这种方式的沙箱只关注应用激活和卸载时的差异，并不能控制属性的来源，因为是在全局 window 对象上进行操作，所以全部应用的对全局属性的操作，都会反映在 window 对象上。

```js
function iter(win, cb) {
  for (const k in win) {
    if (win.hasOwnProperty(k) || k === "clearInterval") {
      cb(k);
    }
  }
}

class SnapshotSandBox {
  deleteProps = new Set();
  modifyPropsMap = {};
  proxy = window;
  snapshot = {};

  active() {
    this.snapshot = {};
    // 激活时记录当前的window快照，不关心 window 上是否有其他应用的属性。
    // 只关心本次激活和卸载时属性的变化， 就是子应用的属性变化。
    iter(window, (k) => {
      this.snapshot[k] = window[k];
    });

    // 之前卸载时检测出修改或添加的属性，本次激活时要添加回来
    // 虽然添加和修改的属性都是在 window 上，但是应用卸载后可能被其他应用删除或重写
    // 这里使用记录值恢复之前的状态

    Object.keys(this.modifyPropsMap).forEach((k) => {
      window[k] = this.modifyPropsMap[k];
    });

    // 删除卸载时记录的删除值
    // 同样因为其他同框架的子应用可能会添加相同属性

    this.deleteProps.forEach((k) => {
      delete window[k];
    });

    this.sandboxRunning = true;
  }

  inactive() {
    this.deleteProps.clear();
    this.modifyPropsMap = {};

    // 和刚激活应用时的快照对比，检查新增或修改的属性
    iter(window, (k) => {
      if (window[k] !== this.snapshot[k]) {
        this.modifyPropsMap[k] = window[k];
      }
    });

    // 快照中有，但是当前 window 上没有，那么属性被删除

    iter(this.snapshot, (k) => {
      if (!window.hasOwnProperty(k)) {
        this.deleteProps.add(k);
        // 恢复环境， 应用中删除的属性，退出应用是需要还原
        window[k] = this.snapshot[k];
      }
    });
    this.sandboxRunning = false;
  }
}
```

由于快照沙箱，对属性的操作都是在 window 上，因此多子应用的时候无法隔离子应用的状态，会导致冲突。只能适用于单实例。

##### proxy 沙箱

```js
const createFakeWindow = (globalContext, speed) => {
  const fakeWindow = {};
  const propertiesWithGetter = new Map();
  // 获取 window 静态属性
  Object.getOwnPropertyNames(globalContext)
    .filter((p) => {
      // 属性描述符
      // configurable 为假表示不能 修改，不能删除

      const dec = Object.getOwnPropertyDescriptor(globalContext, p);
      return dec?.configurable;
    })
    .forEach((p) => {
      const descriptor = Object.getOwnPropertyDescriptor(globalContext, p);
      if (descriptor) {
        const hasGetter = Object.prototype.hasOwnProperty.call(
          descriptor,
          "get"
        );

        // FAQ window 引用属性，为什么需要要修改属性描述符
        if (
          p === "self" ||
          p === "window" ||
          p === "parent" ||
          p === "top" ||
          (speed && p === "document")
        ) {
          descriptor.configurable = true;

          // 属性访问器和， writable 属性描述符不能同时指定
          if (!hasGetter) {
            descriptor.writable = true;
          }
        }

        // 记录所有所有访问器得属性
        if (hasGetter) propertiesWithGetter.set(p, true);

        // FAQ 所有 configurable 为假得属性，就一定是环境级别属性属性么
        Object.defineProperties(fakeWindow, p, Object.freeze(descriptor));
      }
    });
  // Object.keys(window).forEach(k=>{
  //     if( has)
  //     const propDescriptor =   Object.getOwnPropertyDescriptor(window,k);
  //     c
  // })
};

let activeSandboxCount = 0;

class ProxySandBox {
  sandboxRunning = true;
  activeSandboxCount = 0;
  document = document;
  constructor(name, globalContext = window, opts) {
    this.name = name;
    this.globalContext = globalContext;
    this.type = "proxy";
    const { updatedValueSet } = this;
    const { speedy } = opts || {};
    const { fakeWindow, propertiesWithGetter } = createFakeWindow(
      globalContext,
      !!speedy
    );

    const proxy = new Proxy(fakeWindow, {
      get(target, p) {
        // this.registerRunningApp()

        // 处理对一些特殊属性值得处理

        //Symbol.unscopables 提供了一种机制，允许对象指定哪些属性在 with 语句中不应该被暴露为局部变量。如果一个属性在对象的 Symbol.unscopables 列表中，它将不会出现在 with 语句的作用域中。
        //   const obj = {
        //     a: 1,
        //     b: 2,
        //     [Symbol.unscopables]: {
        //         b: true // 使 'b' 在 with 语句中不可见
        //     }
        // };

        if (p === Symbol.unscopables) return unscopables;
        if (p === "window" || p === "self" || p === "globalThis") {
          return proxy;
        }

        // 如果获取得上级 window, 允许逃逸
        if (p === "top" || p === "parent") {
          if (globalContext === globalContext.parent) {
            return proxy;
          }
          return globalContext[p];
        }

        if (p === "hasOwnProperty") {
          // proxy.hasOwnProperty.call({a},'a')
          return function hasOwnProperty(key) {
            if (this !== proxy && this !== null && typeof this === "object") {
              return Object.prototype.hasOwnProperty.call(this, key);
            }

            // proxy.hasOwnProperty("a")
            return (
              fakeWindow.hasOwnProperty(key) ||
              globalContext.hasOwnProperty(key)
            );
          };
        }

        if (p === "document") {
          return this.document;
        }

        if (p === "eval") {
          return eval;
        }
        // customProp {configurable:false} => {configurable:true}
        const actualTarget = propertiesWithGetter.has(p)
          ? globalContext
          : p in target
          ? target
          : globalContext;
        const value = actualTarget[p];

        // 校验了是不是frozen的属性， 如果是需要直接返回
        // propertyDescriptor.configurable === false
        // && (propertyDescriptor.writable === false || (propertyDescriptor.get && !propertyDescriptor.set)),
        if (isPropertyFrozen(actualTarget, p)) {
          return value;
        }
        // 非原生全局属性直接返回 addEventListener
        // isNativeGlobalProp 枚举了 所有的全局属性
        // useNativeWindowForBindingsProps 记录所有执行时需要绑定原生window方法 [fetch,true]
        if (!isNativeGlobalProp(p) && !useNativeWindowForBindingsProps.has(p)) {
          return value;
        }

        // 如果不处理 fetch.bind(this) 实际时绑定的proxyWindow 导致报错
        const boundTarget = useNativeWindowForBindingsProps.get(p)
          ? nativeGlobal
          : globalContext;

        // 仅绑定 isCallable && !isBoundedFunction && !isConstructable 的函数对象，如 window.console、window.atob 这类，不然微应用中调用时会抛出 Illegal invocation 异常
        // 目前没有完美的检测方式，这里通过 prototype 中是否还有可枚举的拓展方法的方式来判断
        // @warning 这里不要随意替换成别的判断方式，因为可能触发一些 edge case（比如在 lodash.isFunction 在 iframe 上下文中可能由于调用了 top window 对象触发的安全异常）
        const rebindTarget2Fn = (target, fn) => {
          const isCallable = (fn) =>
            typeof fn === "function" && fn instanceof Function;
          // bind 函数的名称会以 bound开头  "bound fn"
          const isBoundedFunction = (fn) =>
            fn.name.indexOf("bound ") === 0 && !fn.hasOwnProperty("prototype");

          const isConstructable = () => {
            const hasPrototypeMethods =
              fn.prototype &&
              // class有constructor属性
              fn.prototype.constructor === fn &&
              // 构造器需要有原型链
              Object.getOwnPropertyNames(fn.prototype).length > 1;
            if (hasPrototypeMethods) return true;
            // 假设以下视为构造函数
            // 1. 有 prototype 并且 prototype 上有定义一系列非 constructor 属性
            // 2. 函数名大写开头
            // 3. class 函数

            let constructable = hasPrototypeMethods;
            if (!constructable) {
              const fnString = fn.toString();
              const constructableFunctionRegex = /^function\b\s[A-Z].*/;
              const classRegex = /^class\b/;
              constructable =
                constructableFunctionRegex.test(fnString) ||
                classRegex.test(fnString);
            }

            return constructable;
          };

          if (
            isCallable(fn) &&
            !isBoundedFunction(fn) &&
            !isConstructable(fn)
          ) {
            const boundValue = Function.prototype.bind.call(fn, target);

            // 拷贝原有方法的静态属性
            Object.getOwnPropertyNames(fn).forEach((key) => {
              // boundValue might be a proxy, we need to check the key whether exist in it
              if (!boundValue.hasOwnProperty(key)) {
                Object.defineProperty(
                  boundValue,
                  key,
                  Object.getOwnPropertyDescriptor(fn, key)
                );
              }
            });

            // 如果原方法 prototype 属性设置了不可枚举，会导致原型链丢失
            // 赋值的时候不能使用 = 或 Object.assign, 因为赋值操作会向上查询原型链
            // 如果描述符被设 writable =false 或没有 set 属性访问器，会抛出错误
            // Cannot assign to read only property 'prototype' of function
            if (
              fn.hasOwnProperty("prototype") &&
              !boundValue.hasOwnProperty("prototype")
            ) {
              Object.defineProperty(boundValue, "prototype", {
                value: fn.prototype,
                enumerable: false,
                writable: true,
              });
            }

            // 有一些库会使用 /native code/.test(fn.toString()) 检测是不是原生的方法
            // 如果不特殊处理，所有toString 返回的都是 [object fakeWindow] 或 [object Window]]
            if (typeof fn.toString === "function") {
              const valueHasInstanceToString =
                fn.hasOwnProperty("toString") &&
                !boundValue.hasOwnProperty("toString");
              const boundValueHasPrototypeToString =
                boundValue.toString === Function.prototype.toString;

              if (valueHasInstanceToString || boundValueHasPrototypeToString) {
                // valueHasInstanceToString? 有自定义的 toString 使用原方法
                //                         : 使用原生的 toString
                const originToStringDescriptor =
                  Object.getOwnPropertyDescriptor(
                    valueHasInstanceToString ? fn : Function.prototype,
                    "toString"
                  );

                Object.defineProperty(
                  boundValue,
                  "toString",
                  Object.assign(
                    {},
                    originToStringDescriptor,
                    originToStringDescriptor?.get
                      ? null
                      : { value: () => fn.toString() }
                  )
                );
              }
            }
          }
        };
        return rebindTarget2Fn(boundTarget, value);
      },
    });
  }

  active() {
    if (!this.activeSandboxCount) activeSandboxCount += 1;
    this.sandboxRunning = true;
  }
  inActive() {
    this.sandboxRunning = false;
  }
  patchDocument(doc) {
    this.document = doc;
  }
}
```
