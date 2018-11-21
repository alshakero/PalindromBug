const Palindrom = require('palindrom');
const fetch = require('node-fetch');
const url = require('url');

function asyncTest() {
  let fireMeWhenServerReponses;

  function wait() {
    return new Promise(resolve => {
      fireMeWhenServerReponses = resolve;
    });
  }

  return new Promise(async function(resolve, reject) {
    const URL = 'http://localhost:8080/showroom/product/5g';
    const response = await fetch(URL, {
      headers: {
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8'
      }
    });
    const html = await response.text();
    const sessionURL = html.match(/remote\-url=\"(.*?)\"/)[1];
    const palindromURL = url.resolve(URL, sessionURL);
    const palindrom = new Palindrom({
      remoteUrl: palindromURL,
      pingIntervalS: 60,
      useWebSocket: true,
      onRemoteChange: change => {
        if (change[0].path === '') return;
        fireMeWhenServerReponses && setTimeout(fireMeWhenServerReponses);
      },
      debug: true,
      ot: true,
      purity: false,
      localVersionPath: '/_ver#c$',
      remoteVersionPath: '/_ver#s',
      onStateReset: async obj => {
        const TopRightCart =
          obj.BlendingProvider_0.Content.BlendingProvider_0.Sections.TopRight
            .ShoppingCart_0;

        if (TopRightCart.ItemsInCart !== 0) {
          reject(`Found ${TopRightCart.ItemsInCart} items in cart! Expected 0`);
        }

        const cart =
          obj.BlendingProvider_0.Content.BlendingProvider_0.Sections.Main
            .BlendingProvider_1.KeptViews[0].OriginalResponse.Showroom_0
            .CurrentPage.ShoppingCart_0;

        cart.AddToCartTrigger$++;

        await wait(100);

        if (TopRightCart.ItemsInCart !== 1) {
          reject(
            `Found ${TopRightCart.ItemsInCart} items in cart! Expected count: 1`
          );
        }

        const increaseBy = Math.floor(Math.random() * 20);
        obj.BlendingProvider_0.Content.BlendingProvider_0.Sections.Main.BlendingProvider_1.KeptViews[0].OriginalResponse.Showroom_0.CurrentPage.ShoppingCart_0.Quantity$ += increaseBy;

        await wait(100);

        cart.AddToCartTrigger$++;

        await wait(100);

        if (TopRightCart.ItemsInCart !== increaseBy + 2) {
          reject(
            `Found ${
              TopRightCart.ItemsInCart
            } items in cart! Expected count: ${increaseBy + 2}`
          );
        }
        console.log(
          `Found ${TopRightCart.ItemsInCart} items in cart as expected!`
        );
        resolve();
      }
    });
  });
}

let tests = [];
for (let i = 0; i < 100; i++) {
  const test = asyncTest();
  tests.push(test);
}

Promise.all(tests)
  .then(() => {
    console.log('Passed!');
    process.exit(0);
  })
  .catch(reason => {
    console.error(reason);
    process.exit(1);
  });
