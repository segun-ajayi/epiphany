// Mock data — replace with CMS / API integration when ready.

import heroChurch from "@/assets/hero-church.jpg";
import churchExterior from "@/assets/church-exterior.jpg";
import congregation from "@/assets/congregation.jpg";
import bible from "@/assets/bible.jpg";
import logo from "@/assets/logoACE.png";
import rectorPhoto from "@/assets/SitePhotos/rector.png";

export const CHURCH = {
  name: "Anglican Church of the Epiphany, Houston",
  shortName: "Diocese of All Nation (ACNA)",
  tagline: "Growing in Faith, Worship, and Community in Houston, Texas",
  address: "13111 Westheimer Road, Suite #130 Houston Tx 77077",
  phone: "+1 (281) 870-3231",
  email: "acerichmondtx28@gmail.com",
  social: {
    facebook: "https://facebook.com",
    instagram: "https://instagram.com",
    youtube: "https://youtube.com",
  },
};

export const IMAGES = { heroChurch, churchExterior, congregation, bible, logo };

/**
 * GALLERY — auto-imported from `src/assets/galleryPictures/`.
 *
 * Drop any image (jpg/jpeg/png/webp/avif/gif/svg) into that folder and it will
 * appear in the gallery automatically on the next build. The filename (without
 * extension) becomes the caption; prefix with a number (e.g. `01-easter.jpg`)
 * to control display order.
 *
 * Optionally tag a photo with a category by including `__category` in the
 * filename, e.g. `05-baptism__Worship.jpg` → category "Worship".
 */
export type GalleryPhoto = {
  id: string;
  src: string;
  alt: string;
  category: string;
};

const galleryModules = import.meta.glob<{ default: string }>(
  "../assets/galleryPictures/*.{jpg,jpeg,png,webp,avif,gif,svg}",
  { eager: true },
);

export const GALLERY: GalleryPhoto[] = Object.entries(galleryModules)
  .map(([path, mod]) => {
    const file = path.split("/").pop() ?? path;
    const base = file.replace(/\.[^.]+$/, "");
    const [namePart, categoryPart] = base.split("__");
    const cleanName = namePart
      .replace(/^\d+[-_\s]*/, "")
      .replace(/[-_]+/g, " ")
      .trim();
    return {
      id: base,
      src: mod.default,
      alt: cleanName || "Gallery photo",
      category: categoryPart?.trim() || "All",
      _sort: file,
    };
  })
  .sort((a, b) => a._sort.localeCompare(b._sort))
  .map(({ _sort, ...rest }) => rest);

export const GALLERY_CATEGORIES = [
  "All",
  ...Array.from(new Set(GALLERY.map((p) => p.category))).filter((c) => c !== "All"),
];

export const SERVICE_TIMES = [
  {
    day: "Sunday",
    title: "Sunday School",
    time: "10:00 AM",
    description:
      "Sunday School is a joyful time of learning God’s Word through stories, songs, and activities that build faith and character.",
  },
  {
    day: "Sunday",
    title: "Family Sunday Service",
    time: "10:30 AM",
    description:
      "Family Sunday Service is a joyful gathering where we worship together, share God’s Word, and celebrate faith as one family.",
  },
  {
    day: "Wednesday",
    title: "Prayer meeting",
    time: "7:00 PM",
    description: "Mid-week scripture study and fellowship.",
  },
];

export type Ministry = {
  id: string;
  name: string;
  description: string;
  longDescription: string;
  meetingTime?: string;
  leader?: string;
  email?: string;
  image: string;
};

export const MINISTRIES: Ministry[] = [
  {
    id: "children",
    name: "Children's Ministry",
    description:
      "Nurturing young hearts in the love of Christ through Bible stories, music, and creative play.",
    longDescription:
      "The Children’s Ministry is a vibrant and nurturing environment where young hearts are introduced to the love of Jesus Christ. Through Bible lessons, worship, fellowship, and engaging activities, we help children grow in faith, character, and understanding of God’s Word. Our desire is to raise a generation that knows God, loves Him, and follows Him faithfully throughout their lives. We warmly welcome every child to discover the joy of belonging to God’s family.",
    // meetingTime: "Sundays · 10:30 AM",
    // leader: "Sarah Mitchell",
    // email: "children@epiphanyhouston.org",
    image: congregation,
  },
  {
    id: "youth",
    name: "Youth Ministry",
    description: "Equipping youths to live boldly for Christ.",
    longDescription:
      "The Youth Ministry is dedicated to empowering young people to develop a strong and personal relationship with Jesus Christ. In a world filled with challenges and opportunities, we provide spiritual guidance, fellowship, mentorship, and opportunities for service. We encourage our youth to embrace their God-given purpose, live boldly for Christ, and become positive influences in their families, schools, communities, and beyond.",
    // meetingTime: "Sundays · 5:00 PM",
    // leader: "David Owen",
    // email: "youth@epiphanyhouston.org",
    image: heroChurch,
  },
  {
    id: "mens",
    name: "Men's Fellowship",
    description: "Building brotherhood through scripture, prayer, and shared mission.",
    longDescription:
      "The Men’s Fellowship is a brotherhood of Christian men committed to growing in faith, leadership, and service. We strive to strengthen one another through prayer, Bible study, fellowship, and practical support. As men of God, we seek to be faithful leaders in our homes, church, workplace, and community, reflecting the character and love of Christ in all we do.",
    // meetingTime: "1st Saturdays · 8:00 AM",
    // leader: "Michael Harper",
    // email: "men@epiphanyhouston.org",
    image: bible,
  },
  {
    id: "womens",
    name: "Women's Fellowship",
    description: "A vibrant community of women growing together in faith and friendship.",
    longDescription:
      "The Women’s Fellowship is a caring and empowering community where women come together to grow spiritually, build meaningful relationships, and serve God with passion. Through prayer, fellowship, Bible study, and outreach, we encourage one another to fulfill God’s purpose in our lives. We celebrate the unique gifts and calling of every woman and seek to make a lasting impact for Christ in our families, church, and society.",
    // meetingTime: "Tuesdays · 9:30 AM",
    // leader: "Grace Adeyemi",
    // email: "women@epiphanyhouston.org",
    image: churchExterior,
  },
  {
    id: "prayer",
    name: "Prayer Ministry",
    description: "Interceding for our church, city, and world.",
    longDescription:
      "The Prayer Ministry stands at the heart of the church’s spiritual life, believing that prayer is the key to experiencing God’s presence, power, and guidance. We are committed to interceding for the church, our families, our community, and the world. Through faithful prayer, we seek God’s will, strengthen believers, and witness His transforming work in every area of life. We invite all who desire a deeper prayer life to join us in this vital ministry.",
    // meetingTime: "Thursdays · 6:30 PM",
    // leader: "Rev. Caroline Akin",
    // email: "prayer@epiphanyhouston.org",
    image: bible,
  },
  {
    id: "choir",
    name: "Choir Ministry",
    description: "Leading the congregation in worship through sacred music.",
    longDescription:
      "The Choir Ministry is a dedicated team of worshippers called to glorify God through music and song. Through heartfelt praise and worship, we lead the congregation into God’s presence and proclaim His greatness. Our ministry seeks not only musical excellence but also spiritual devotion, using our gifts to inspire faith, encourage believers, and draw hearts closer to God. Every song we sing is an offering of worship to our Lord and Savior.",
    // meetingTime: "Thursdays · 7:30 PM",
    // leader: "James Whitcombe",
    // email: "choir@epiphanyhouston.org",
    image: heroChurch,
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
    speaker: "Ven. Dr. Isaac Ifedayo Olasehinde",
    date: "2025-05-25",
    scripture: "John 8:12",
    series: "Epiphany 2025",
    topic: "Discipleship",
    description: "Jesus declares himself the light that overcomes every darkness in our lives.",
    thumbnail: heroChurch,
    youtubeId: "dQw4w9WgX66cQ",
    mixlrUrl: MIXLR_EMBED_URL,
    notesPdf: "/sermon-notes/light-of-the-world.pdf",
  },
  // {
  //   id: "abide-in-me",
  //   title: "Abide in Me",
  //   speaker: "Rev. Caroline Akin",
  //   date: "2025-05-18",
  //   scripture: "John 15:1-11",
  //   series: "Words of Jesus",
  //   topic: "Prayer",
  //   description: "The fruitful life flows from union with Christ.",
  //   thumbnail: bible,
  //   youtubeId: "dQw4w9WgXcQ",
  //   mixlrUrl: MIXLR_EMBED_URL,
  //   notesPdf: "/sermon-notes/abide-in-me.pdf",
  // },
  // {
  //   id: "the-good-shepherd",
  //   title: "The Good Shepherd",
  //   speaker: "Rev. Thomas Reid",
  //   date: "2025-05-11",
  //   scripture: "Psalm 23",
  //   series: "Psalms of Trust",
  //   topic: "Comfort",
  //   description: "How the Shepherd leads, restores, and accompanies his people.",
  //   thumbnail: churchExterior,
  //   youtubeId: "dQw4w9WgXcQ",
  //   mixlrUrl: MIXLR_EMBED_URL,
  //   notesPdf: "/sermon-notes/the-good-shepherd.pdf",
  // },
  // {
  //   id: "fishers-of-men",
  //   title: "Fishers of Men",
  //   speaker: "Pastor Daniel Cole",
  //   date: "2025-05-04",
  //   scripture: "Matthew 4:18-22",
  //   series: "Called",
  //   topic: "Mission",
  //   description: "Christ's invitation to leave our nets and follow him.",
  //   thumbnail: congregation,
  //   youtubeId: "dQw4w9WgXcQ",
  //   mixlrUrl: MIXLR_EMBED_URL,
  //   notesPdf: "/sermon-notes/fishers-of-men.pdf",
  // },
  // {
  //   id: "the-bread-of-life",
  //   title: "The Bread of Life",
  //   speaker: "Rev. Caroline Akin",
  //   date: "2025-04-27",
  //   scripture: "John 6:35",
  //   series: "Words of Jesus",
  //   topic: "Sacraments",
  //   description: "How Christ satisfies the deepest hunger of the soul.",
  //   thumbnail: bible,
  //   youtubeId: "dQw4w9WgXcQ",
  //   mixlrUrl: MIXLR_EMBED_URL,
  //   notesPdf: "/sermon-notes/the-bread-of-life.pdf",
  // },
  // {
  //   id: "resurrection-hope",
  //   title: "Resurrection Hope",
  //   speaker: "Rev. Thomas Reid",
  //   date: "2025-04-20",
  //   scripture: "1 Corinthians 15",
  //   series: "Easter",
  //   topic: "Hope",
  //   description: "The empty tomb changes everything — for now and forever.",
  //   thumbnail: heroChurch,
  //   youtubeId: "dQw4w9WgXcQ",
  //   mixlrUrl: MIXLR_EMBED_URL,
  //   notesPdf: "/sermon-notes/resurrection-hope.pdf",
  // },
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
  // {
  //   id: "summer-vbs",
  //   title: "Summer Vacation Bible School",
  //   date: "2026-06-15",
  //   time: "9:00 AM – 12:00 PM",
  //   location: "Parish Hall",
  //   category: "Youth",
  //   description: "A week of faith, fun, and friendship for children ages 4–12.",
  //   image: congregation,
  // },
  // {
  //   id: "community-dinner",
  //   title: "Community Dinner",
  //   date: "2026-06-21",
  //   time: "6:00 PM",
  //   location: "Fellowship Hall",
  //   category: "Fellowship",
  //   description: "Open table dinner for members and neighbors — bring a friend.",
  //   image: churchExterior,
  // },
  // {
  //   id: "outreach-day",
  //   title: "Houston Outreach Day",
  //   date: "2026-07-05",
  //   time: "8:00 AM",
  //   location: "Citywide",
  //   category: "Outreach",
  //   description: "Serving our neighborhoods through food drives, beautification, and prayer.",
  //   image: heroChurch,
  // },
  // {
  //   id: "mens-breakfast",
  //   title: "Men's Fellowship Breakfast",
  //   date: "2026-06-07",
  //   time: "8:00 AM",
  //   location: "Fellowship Hall",
  //   category: "Fellowship",
  //   description: "Breakfast, scripture, and brotherhood.",
  //   image: bible,
  // },
  // {
  //   id: "summer-bible-study",
  //   title: "Summer Bible Study: The Gospel of John",
  //   date: "2026-06-11",
  //   time: "7:00 PM",
  //   location: "Library",
  //   category: "Bible Study",
  //   description: "A 10-week journey through the fourth Gospel.",
  //   image: bible,
  // },
];

export type Leader = {
  name: string;
  role: string;
  bio: string;
  email: string;
  photo?: string; // optional photo URL
  socials?: {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    instagram?: string;
  };
};

export const LEADERSHIP: Leader[] = [
  {
    name: "Rt. Rev. Dr. Felix Orji",
    role: "The Diocesan",
    bio: "",
    email: "felix@example.com",
    photo: logo,
    socials: {
      facebook: "https://facebook.com/felixorji",
      twitter: "https://twitter.com/felixorji",
      linkedin: "https://linkedin.com/in/felixorji",
    },
  },
  {
    name: "Ven. Dr. Isaac Ifedayo Olasehinde",
    role: "The Rector",
    bio: "",
    email: "isaac@example.com",
    photo: rectorPhoto,
    socials: {
      facebook: "https://facebook.com/isaacolasehinde",
      twitter: "https://twitter.com/isaacolasehinde",
      linkedin: "https://linkedin.com/in/isaacolasehinde",
    },
  },
];

export type Beliefs = {
  title: string;
  body: string;
};

export const BELIEFS: Beliefs[] = [
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

export type History = {
  year: string;
  title: string;
  body: string;
};

export const HISTORY: History[] = [
  {
    year: "2024",
    title: "Founding",
    body: "ANGLICAN CHURCH OF THE EPIPHANY, HOUSTON is planted by a small group of families committed to faithful Anglican worship in Houston.",
  },
  // {
  //   year: "1978",
  //   title: "New Sanctuary",
  //   body: "Our current sanctuary is consecrated, a gift of generosity from generations of members.",
  // },
  // {
  //   year: "1995",
  //   title: "Outreach Expansion",
  //   body: "Launch of partnerships with neighborhood schools and a permanent food pantry.",
  // },
  // {
  //   year: "2010",
  //   title: "Family Service",
  //   body: "A second Sunday service is added to welcome growing families.",
  // },
  {
    year: "2026",
    title: "2+ Years On",
    body: "Celebrating 2 years of faith, fellowship, and growth together!",
  },
];

export type Testimonials = {
  name: string;
  quote: string;
};

export const TESTIMONIALS: Testimonials[] = [
  // {
  //   name: "Anita & Joseph M.",
  //   quote:
  //     "We walked in as visitors and left feeling like family. Epiphany has been our spiritual home for over a decade.",
  // },
  // {
  //   name: "Marcus T.",
  //   quote:
  //     "The teaching is rich, the worship is reverent, and the people genuinely love one another. It's a rare gift.",
  // },
  // {
  //   name: "Priya R.",
  //   quote:
  //     "The children's ministry has shaped our kids in ways we can hardly put into words. We're so grateful.",
  // },
];

export const FAQ_VISIT = [
  {
    q: "What should I expect on my first visit?",
    a: "A warm welcome, an Anglican liturgy with scripture, prayer, and Communion, and friendly people happy to answer questions.",
  },
  {
    q: "What should I wear?",
    a: "Come as you are — you'll see everything from suits to jeans. We care more that you're here than what you wear.",
  },
  {
    q: "Is there childcare?",
    a: "Yes, nursery is available during all services and children's programs run during the 10:30 AM service.",
  },
  {
    q: "Where do I park?",
    a: "Free parking is available in our main lot off Faith Avenue, with overflow across the street.",
  },
];

export const FAQ_GIVE = [
  {
    q: "Is my donation tax-deductible?",
    a: "Yes — Anglican Church of Epiphany is a 501(c)(3) organization. You'll receive a receipt for every gift.",
  },
  // {
  //   q: "Can I set up recurring giving?",
  //   a: "Absolutely. Choose 'Recurring' on the donation form to give weekly, monthly, or annually.",
  // },
  // {
  //   q: "Can I designate my gift?",
  //   a: "Yes, select a designation on the form — General Fund, Missions, Building Fund, Youth, or Outreach.",
  // },
  {
    q: "How is the church funded?",
    a: "Through the faithful, generous giving of our members and friends. We publish an annual report each year.",
  },
];
