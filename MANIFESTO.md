# Billion

> Congressional App Challenge 2025 -> AI.gov 2026

# What is Billion?

Tagline for now: An AI-powered mobile app that makes political information accessible through engaging, short-form content.

## The idea/problem

If I asked you right now about what laws are currently about to be passed, what sort of important cases are currently happening, or what the President has most recently done (maybe except for the Venezuela thing), you probably have no idea.

Or maybe you have. However, you likely only have heard of the craziest things that are happening on the news or on social media. This provides a very skewed view of the political landscape. A well-informed people is the foundation to democracy, and the lack of information is a threat to democracy.

## The initial vision

The issue isn't the lack of information, but the lack of access to information. Billion aims to bridge this gap by providing a platform where users can easily access and understand complex political topics.

It aims to use artificial intelligence to generate summaries, analyses, and visual content about laws, bills, political actions, and their real-world consequences across the political spectrum. See [this Instagram account](https://www.instagram.com/bothsidesnews_/) for inspiration.

## What it currently is

Currently, we have functional scrapers only for presidential actions and other [White House news](https://www.whitehouse.gov/news/) (I think?). Additionally, we have a sort of mock-feed which we planned to replace with fully AI-generated videos. But for now, it stands as a proof-of-concept with just article cards and poorly AI-generated articles (not engaging nor is it concisely presented).

## The vision for now

Given our Janurary 20th implementation deadline, I believe we should aim to get the app to this state:

1. A feed with previews of things to talk about/check out. Short-form videos and super-summarized article previews (tweets kind of?)
  - Not sure how easy video generation will be. In the air for now. I have several ideas (Obviously for all of these, the script would be AI generated):
    - Generated subway surfers (or Minecraft parkour or similar) + text format
    - Slideshow + voiceover kind of like those YouTube documentaries
    - (hardest) complete end-to-end designed video with scenes and relevant graphics. Maybe Sora video gen if possible; otherwise use image generation APIs for a scene or even Claude + Motion Canvas (or Remotion) with a voiceover
  - Videos and article previews will always link to a long-form article (everything is AI generated)
2. Long-form articles to explain in depth (but the user can optionally personalize it on-demand. Length, style, etc. What interests it may affect, etc)
  - Research agent?
3. Personalization of the feed via a double-tap-to-like?
4. Being able to search long-form articles

### What needs to be done

**The currently article generation**
- Fix/write scrapers for more direct political sources, including
  - Current cases
  - Current bills to be passed
- Change the article generation to be more user-friendly and use more advanced prompting
- Include (AI generated or Google search + citations) relevant graphics for the articles
  - Tool calls inside the articles to link to assets or whatever
  - AI generated thumbnails?
- Maybe link to real, human articles about the subject (or at least force references to the original article in our AI-generated version)

OOH! Maybe make the current "political discourse" feature much more interactive than just static text. Maybe you get to see agents debate in real time! You choose the agenda, topic, style, speed, etc or you stick to the defaults! Text to speech, anyone?
  
**The current feed**

- Make the UI look better, visually
- Actually implement the "link to article" feature
- The mini-previews should be a lot more interesting. Maybe force Nano banana to design an ad for every single article?

**The app itself**

- Overall styling (not using Tailwind CSS rn btw 💀)
- Dark mode
- Launch on App Store (somebody get us a better icon)

**Video generation**

TBD. Honestly, this is a last priority since graphics should deem sufficient.

## The ultimate vision

Be the ultimate place for political discourse and knowledge base. Maybe even a "how will this affect X" feature.
