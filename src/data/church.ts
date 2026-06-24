// Mock data — replace with CMS / API integration when ready.

import heroChurch from "@/assets/hero-church.jpg";
import churchExterior from "@/assets/church-exterior.jpg";
import congregation from "@/assets/congregation.jpg";
import bible from "@/assets/bible.jpg";

export const CHURCH = {
  name: "Anglican Church of Epiphany",
  shortName: "Epiphany",
  tagline: "Growing in Faith, Worship, and Community in Houston, Texas",
  address: "1234 Faith Avenue, Houston, TX 77001",
  phone: "(713) 555-0142",
  email: "hello@epiphanyhouston.org",
  social: {
    facebook: "https://facebook.com",
    instagram: "https://instagram.com",
    youtube: "https://youtube.com",
  },
};

export const IMAGES = { heroChurch, churchExterior, congregation, bible };

export const SERVICE_TIMES = [
  {
    day: "Sunday",
    title: "Traditional Worship",
    time: "8:00 AM",
    description: "A reverent liturgy with hymns and Holy Communion.",
  },
  {
    day: "Sunday",
    title: "Family Service",
    time: "10:30 AM",
    description: "Contemporary worship with children's programs.",
  },
  {
    day: "Wednesday",
    title: "Bible Study",
    time: "7:00 PM",
    description: "Mid-week scripture study and fellowship.",
  },
];

export type Ministry = {
  id: string;
  name: string;
  description: string;
  longDescription: string;
  meetingTime: string;
  leader: string;
  email: string;
  image: string;
};

export const MINISTRIES: Ministry[] = [
  {
    id: "childrens",
    name: "Children's Ministry",
    description: "Nurturing young hearts in the love of Christ through Bible stories, music, and creative play.",
    longDescription: "Our Children's Ministry serves families with children from infants through 5th grade. We offer Sunday school, VBS, and family worship events designed to help children encounter Jesus.",
    meetingTime: "Sundays · 10:30 AM",
    leader: "Sarah Mitchell",
    email: "children@epiphanyhouston.org",
    image: congregation,
  },
  {
    id: "youth",
    name: "Youth Ministry",
    description: "Equipping students in grades 6–12 to live boldly for Christ.",
    longDescription: "Weekly gatherings filled with worship, teaching, small groups, and service opportunities — plus retreats and mission trips throughout the year.",
    meetingTime: "Sundays · 5:00 PM",
    leader: "David Owen",
    email: "youth@epiphanyhouston.org",
    image: heroChurch,
  },
  {
    id: "mens",
    name: "Men's Fellowship",
    description: "Building brotherhood through scripture, prayer, and shared mission.",
    longDescription: "Monthly breakfasts, study groups, and service projects designed to encourage men to grow as husbands, fathers, and servants of Christ.",
    meetingTime: "1st Saturdays · 8:00 AM",
    leader: "Michael Harper",
    email: "men@epiphanyhouston.org",
    image: bible,
  },
  {
    id: "womens",
    name: "Women's Fellowship",
    description: "A vibrant community of women growing together in faith and friendship.",
    longDescription: "Bible studies, retreats, and outreach efforts that nurture women in every season of life.",
    meetingTime: "Tuesdays · 9:30 AM",
    leader: "Grace Adeyemi",
    email: "women@epiphanyhouston.org",
    image: churchExterior,
  },
  {
    id: "prayer",
    name: "Prayer Ministry",
    description: "Interceding for our church, city, and world.",
    longDescription: "Join our prayer team for weekly intercession, healing prayer after services, and a 24/7 prayer chain.",
    meetingTime: "Thursdays · 6:30 PM",
    leader: "Rev. Caroline Akin",
    email: "prayer@epiphanyhouston.org",
    image: bible,
  },
  {
    id: "choir",
    name: "Choir Ministry",
    description: "Leading the congregation in worship through sacred music.",
    longDescription: "From traditional Anglican chant to contemporary anthems, our choir lifts our worship every Sunday.",
    meetingTime: "Thursdays · 7:30 PM",
    leader: "James Whitcombe",
    email: "choir@epiphanyhouston.org",
    image: heroChurch,
  },
  {
    id: "outreach",
    name: "Outreach Ministry",
    description: "Bringing the love of Christ to our neighbors in Houston.",
    longDescription: "Food pantry, shelter partnerships, ESL classes, and quarterly community service days.",
    meetingTime: "Saturdays · monthly",
    leader: "Pastor Daniel Cole",
    email: "outreach@epiphanyhouston.org",
    image: congregation,
  },
  {
    id: "bible-study",
    name: "Bible Study Groups",
    description: "Small groups gathering across Houston to study scripture and share life.",
    longDescription: "Home-based groups meeting throughout the week — find one near you.",
    meetingTime: "Various times",
    leader: "Rev. Thomas Reid",
    email: "groups@epiphanyhouston.org",
    image: bible,
  },
];

export type Sermon = {
  id: string;
  title: string;
  speaker: string;
  date: string;
  scripture: string;
  series: string;
  topic: string;
  description: string;
  thumbnail: string;
  /** YouTube video ID (the part after `v=` in a YouTube URL). */
  youtubeId: string;
  /** Full Mixlr showcase/embed URL, e.g. https://mixlr.com/users/USERNAME/embed */
  mixlrUrl: string;
  /** Path to the sermon notes PDF inside /public, e.g. /sermon-notes/light-of-the-world.pdf */
  notesPdf: string;
};

/** Default Mixlr embed URL — replace with the church's actual Mixlr showcase URL. */
export const MIXLR_EMBED_URL = "https://mixlr.com/users/epiphany-houston/embed";

export const SERMONS: Sermon[] = [
  {
    id: "light-of-the-world",
    title: "The Light of the World",
    speaker: "Rev. Thomas Reid",
    date: "2025-05-25",
    scripture: "John 8:12",
    series: "Epiphany 2025",
    topic: "Discipleship",
    description: "Jesus declares himself the light that overcomes every darkness in our lives.",
    thumbnail: heroChurch,
    youtubeId: "dQw4w9WgXcQ",
    mixlrUrl: MIXLR_EMBED_URL,
    notesPdf: "/sermon-notes/light-of-the-world.pdf",
  },
  {
    id: "abide-in-me",
    title: "Abide in Me",
    speaker: "Rev. Caroline Akin",
    date: "2025-05-18",
    scripture: "John 15:1-11",
    series: "Words of Jesus",
    topic: "Prayer",
    description: "The fruitful life flows from union with Christ.",
    thumbnail: bible,
    youtubeId: "dQw4w9WgXcQ",
    mixlrUrl: MIXLR_EMBED_URL,
    notesPdf: "/sermon-notes/abide-in-me.pdf",
  },
  {
    id: "the-good-shepherd",
    title: "The Good Shepherd",
    speaker: "Rev. Thomas Reid",
    date: "2025-05-11",
    scripture: "Psalm 23",
    series: "Psalms of Trust",
    topic: "Comfort",
    description: "How the Shepherd leads, restores, and accompanies his people.",
    thumbnail: churchExterior,
    youtubeId: "dQw4w9WgXcQ",
    mixlrUrl: MIXLR_EMBED_URL,
    notesPdf: "/sermon-notes/the-good-shepherd.pdf",
  },
  {
    id: "fishers-of-men",
    title: "Fishers of Men",
    speaker: "Pastor Daniel Cole",
    date: "2025-05-04",
    scripture: "Matthew 4:18-22",
    series: "Called",
    topic: "Mission",
    description: "Christ's invitation to leave our nets and follow him.",
    thumbnail: congregation,
    youtubeId: "dQw4w9WgXcQ",
    mixlrUrl: MIXLR_EMBED_URL,
    notesPdf: "/sermon-notes/fishers-of-men.pdf",
  },
  {
    id: "the-bread-of-life",
    title: "The Bread of Life",
    speaker: "Rev. Caroline Akin",
    date: "2025-04-27",
    scripture: "John 6:35",
    series: "Words of Jesus",
    topic: "Sacraments",
    description: "How Christ satisfies the deepest hunger of the soul.",
    thumbnail: bible,
    youtubeId: "dQw4w9WgXcQ",
    mixlrUrl: MIXLR_EMBED_URL,
    notesPdf: "/sermon-notes/the-bread-of-life.pdf",
  },
  {
    id: "resurrection-hope",
    title: "Resurrection Hope",
    speaker: "Rev. Thomas Reid",
    date: "2025-04-20",
    scripture: "1 Corinthians 15",
    series: "Easter",
    topic: "Hope",
    description: "The empty tomb changes everything — for now and forever.",
    thumbnail: heroChurch,
    youtubeId: "dQw4w9WgXcQ",
    mixlrUrl: MIXLR_EMBED_URL,
    notesPdf: "/sermon-notes/resurrection-hope.pdf",
  },
];

export type ChurchEvent = {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  category: "Worship" | "Fellowship" | "Outreach" | "Youth" | "Bible Study";
  description: string;
  image: string;
};

export const EVENTS: ChurchEvent[] = [
  {
    id: "summer-vbs",
    title: "Summer Vacation Bible School",
    date: "2026-06-15",
    time: "9:00 AM – 12:00 PM",
    location: "Parish Hall",
    category: "Youth",
    description: "A week of faith, fun, and friendship for children ages 4–12.",
    image: congregation,
  },
  {
    id: "community-dinner",
    title: "Community Dinner",
    date: "2026-06-21",
    time: "6:00 PM",
    location: "Fellowship Hall",
    category: "Fellowship",
    description: "Open table dinner for members and neighbors — bring a friend.",
    image: churchExterior,
  },
  {
    id: "outreach-day",
    title: "Houston Outreach Day",
    date: "2026-07-05",
    time: "8:00 AM",
    location: "Citywide",
    category: "Outreach",
    description: "Serving our neighborhoods through food drives, beautification, and prayer.",
    image: heroChurch,
  },
  {
    id: "mens-breakfast",
    title: "Men's Fellowship Breakfast",
    date: "2026-06-07",
    time: "8:00 AM",
    location: "Fellowship Hall",
    category: "Fellowship",
    description: "Breakfast, scripture, and brotherhood.",
    image: bible,
  },
  {
    id: "summer-bible-study",
    title: "Summer Bible Study: The Gospel of John",
    date: "2026-06-11",
    time: "7:00 PM",
    location: "Library",
    category: "Bible Study",
    description: "A 10-week journey through the fourth Gospel.",
    image: bible,
  },
];

export type Leader = {
  name: string;
  role: string;
  bio: string;
  email: string;
};

export const LEADERSHIP: Leader[] = [
  {
    name: "Rev. Thomas Reid",
    role: "Rector",
    bio: "Father Thomas has served Epiphany since 2014, after fifteen years of parish ministry in the Diocese of Texas.",
    email: "trreid@epiphanyhouston.org",
  },
  {
    name: "Rev. Caroline Akin",
    role: "Associate Priest",
    bio: "Caroline leads our women's ministry, prayer team, and pastoral care, with a special heart for spiritual formation.",
    email: "cakin@epiphanyhouston.org",
  },
  {
    name: "Pastor Daniel Cole",
    role: "Deacon · Outreach",
    bio: "Daniel oversees our outreach ministries and partnerships across Houston.",
    email: "dcole@epiphanyhouston.org",
  },
  {
    name: "David Owen",
    role: "Youth Director",
    bio: "David equips middle and high schoolers to follow Jesus in everyday life.",
    email: "dowen@epiphanyhouston.org",
  },
];

export const BELIEFS = [
  {
    title: "Holy Scripture",
    body: "We believe the Bible is the inspired Word of God — the rule and ultimate standard of faith and life.",
  },
  {
    title: "Anglican Tradition",
    body: "We worship within the historic stream of the Anglican Communion, shaped by the Book of Common Prayer and the creeds of the Church.",
  },
  {
    title: "Worship",
    body: "We gather weekly to encounter the living God through liturgy, scripture, sacrament, and song.",
  },
  {
    title: "Sacraments",
    body: "Baptism and Holy Communion are visible signs of God's invisible grace, instituted by Christ for his Church.",
  },
  {
    title: "Prayer",
    body: "We are formed as a people of prayer through daily offices, intercession, and silent contemplation.",
  },
];

export const HISTORY = [
  { year: "1962", title: "Founding", body: "Epiphany is planted by a small group of families committed to faithful Anglican worship in Houston." },
  { year: "1978", title: "New Sanctuary", body: "Our current sanctuary is consecrated, a gift of generosity from generations of members." },
  { year: "1995", title: "Outreach Expansion", body: "Launch of partnerships with neighborhood schools and a permanent food pantry." },
  { year: "2010", title: "Family Service", body: "A second Sunday service is added to welcome growing families." },
  { year: "2024", title: "60+ Years On", body: "Today we are a multigenerational parish serving the city we love." },
];

export const TESTIMONIALS = [
  {
    name: "Anita & Joseph M.",
    quote: "We walked in as visitors and left feeling like family. Epiphany has been our spiritual home for over a decade.",
  },
  {
    name: "Marcus T.",
    quote: "The teaching is rich, the worship is reverent, and the people genuinely love one another. It's a rare gift.",
  },
  {
    name: "Priya R.",
    quote: "The children's ministry has shaped our kids in ways we can hardly put into words. We're so grateful.",
  },
];

export const FAQ_VISIT = [
  { q: "What should I expect on my first visit?", a: "A warm welcome, an Anglican liturgy with scripture, prayer, and Communion, and friendly people happy to answer questions." },
  { q: "What should I wear?", a: "Come as you are — you'll see everything from suits to jeans. We care more that you're here than what you wear." },
  { q: "Is there childcare?", a: "Yes, nursery is available during all services and children's programs run during the 10:30 AM service." },
  { q: "Where do I park?", a: "Free parking is available in our main lot off Faith Avenue, with overflow across the street." },
];

export const FAQ_GIVE = [
  { q: "Is my donation tax-deductible?", a: "Yes — Anglican Church of Epiphany is a 501(c)(3) organization. You'll receive a receipt for every gift." },
  { q: "Can I set up recurring giving?", a: "Absolutely. Choose 'Recurring' on the donation form to give weekly, monthly, or annually." },
  { q: "Can I designate my gift?", a: "Yes, select a designation on the form — General Fund, Missions, Building Fund, Youth, or Outreach." },
  { q: "How is the church funded?", a: "Through the faithful, generous giving of our members and friends. We publish an annual report each year." },
];
