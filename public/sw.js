const addResourcesToCache = async (resources) => {
  const cache = await caches.open("v1")
  await cache.addAll(resources)
}

const putInCache = async (request, response) => {
  const cache = await caches.open("v1")
  await cache.put(request, response)
}

const cacheFirst = async ({ request, preloadResponsePromise, fallbackUrl }) => {
  // First try to get the resource from the cache
  const responseFromCache = await caches.match(request)
  if (responseFromCache) {
    return responseFromCache
  }

  // Next try to use the preloaded response, if it's there
  // NOTE: Chrome throws errors regarding preloadResponse, see:
  // https://bugs.chromium.org/p/chromium/issues/detail?id=1420515
  // https://github.com/mdn/dom-examples/issues/145
  // To avoid those errors, remove or comment out this block of preloadResponse
  // code along with enableNavigationPreload() and the "activate" listener.
  const preloadResponse = await preloadResponsePromise
  if (preloadResponse) {
    console.info("using preload response", preloadResponse)
    putInCache(request, preloadResponse.clone())
    return preloadResponse
  }

  // Next try to get the resource from the network
  try {
    const responseFromNetwork = await fetch(request.clone())
    // response may be used only once
    // we need to save clone to put one copy in cache
    // and serve second one
    putInCache(request, responseFromNetwork.clone())
    return responseFromNetwork
  } catch (error) {
    const fallbackResponse = await caches.match(fallbackUrl)
    if (fallbackResponse) {
      return fallbackResponse
    }
    // when even the fallback response is not available,
    // there is nothing we can do, but we must always
    // return a Response object
    return new Response("Network error happened", {
      status: 408,
      headers: { "Content-Type": "text/plain" },
    })
  }
}

const enableNavigationPreload = async () => {
  if (self.registration.navigationPreload) {
    // Enable navigation preloads!
    await self.registration.navigationPreload.enable()
  }
}

self.addEventListener("activate", (event) => {
  event.waitUntil(enableNavigationPreload())
})

self.addEventListener("install", (event) => {
  console.log("INSTALLED")
  event.waitUntil(
    addResourcesToCache([
      "/",
      "/live",
      "https://revaise.s3.us-east-2.amazonaws.com/video-bg-1.mp4",
      "https://revaise.s3.us-east-2.amazonaws.com/video-bg-2.mp4",
      "https://revaise.s3.us-east-2.amazonaws.com/video-bg-3.mp4",
      "https://revaise.s3.us-east-2.amazonaws.com/video-bg-4.mp4",
      "https://revaise.s3.us-east-2.amazonaws.com/video-bg-5.mp4",
      "https://revaise.s3.us-east-2.amazonaws.com/video-bg-6.mp4",
      "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?q=80&w=1740",
      "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?q=80&w=1740",
      "https://images.unsplash.com/photo-1563089145-599997674d42?q=80&w=1740",
      "https://images.unsplash.com/photo-1478147427282-58a87a120781?q=80&w=1740",
      "https://images.unsplash.com/photo-1507874457470-272b3c8d8ee2?q=80&w=1740",
      "https://images.unsplash.com/photo-1491396023581-4344e51fec5c?q=80&w=1740",
      "https://images.unsplash.com/photo-1518289646039-3e6c87a5aaf6?q=80&w=1740",
      "https://images.unsplash.com/photo-1503455637927-730bce8583c0?q=80&w=1740",
      "https://images.unsplash.com/photo-1579267205095-6b30ba87edba?q=80&w=1740",
      "https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?q=80&w=1740",
      "https://images.unsplash.com/photo-1523821741446-edb2b68bb7a0?q=80&w=1740",
      "https://images.unsplash.com/photo-1597773150796-e5c14ebecbf5?q=80&w=1740",
      "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=1740",
      "https://presentation-software.s3.eu-west-3.amazonaws.com/kjv.json?x-id=GetObject",
      "https://presentation-software.s3.eu-west-3.amazonaws.com/nkjv.json?x-id=GetObject",
      "https://presentation-software.s3.eu-west-3.amazonaws.com/niv.json?x-id=GetObject",
      "https://presentation-software.s3.eu-west-3.amazonaws.com/amp.json?x-id=GetObject",
      "https://presentation-software.s3.eu-west-3.amazonaws.com/hymns.json?x-id=GetObject",
    ])
  )
})

self.addEventListener("fetch", (event) => {
  event.respondWith(
    cacheFirst({
      request: event.request,
      preloadResponsePromise: event.preloadResponse,
      fallbackUrl: "./gallery/myLittleVader.jpg",
    })
  )
})