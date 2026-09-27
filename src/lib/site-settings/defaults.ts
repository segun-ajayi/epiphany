import { siteSettingsSchema, type SiteSettings } from "./schemas.ts";

export const DEFAULT_SITE_SETTINGS: SiteSettings = siteSettingsSchema.parse({
  churchName: "Anglican Church of the Epiphany, Houston",
  shortName: "Diocese of All Nation (ACNA)",
  tagline: "Growing in Faith, Worship, and Community in Houston, Texas",
  addressLine1: "13111 Westheimer Road",
  addressLine2: "Suite 130",
  city: "Houston",
  region: "TX",
  postalCode: "77077",
  countryCode: "US",
  phone: "+1 (281) 870-3231",
  email: "acerichmondtx28@gmail.com",
  facebookUrl: "",
  instagramUrl: "",
  youtubeUrl: "",
  visitorParking: "",
  visitorChildren:
    "Please contact the church before your visit so our team can share the current arrangements for children and families.",
  visitorAccessibility:
    "Call or email us before your visit and our team will help you plan for your specific access needs.",
  visitorServiceDuration: "",
  defaultSeoTitle: "Anglican Church of the Epiphany, Houston",
  defaultSeoDescription:
    "Join Anglican Church of the Epiphany in Houston, Texas for worship, biblical teaching, prayer, fellowship, and community outreach.",
  socialImagePath: "/social-share.jpg",
  logoImagePath: "",
  footerQuote: "“Arise, shine, for your light has come.” — Isaiah 60:1",
  serviceTimes: [
    {
      id: "00000000-0000-4000-8000-000000000001",
      day: "Sunday",
      time: "10:00 AM",
      title: "Sunday School",
      description:
        "Sunday School is a joyful time of learning God’s Word through stories, songs, and activities that build faith and character.",
    },
    {
      id: "00000000-0000-4000-8000-000000000002",
      day: "Sunday",
      time: "10:30 AM",
      title: "Family Sunday Service",
      description:
        "Family Sunday Service is a joyful gathering where we worship together, share God’s Word, and celebrate faith as one family.",
    },
    {
      id: "00000000-0000-4000-8000-000000000003",
      day: "Wednesday",
      time: "7:00 PM",
      title: "Prayer meeting",
      description: "Mid-week scripture study and fellowship.",
    },
  ],
  home: {
    heroImagePath: "",
    heroIntro: "Growing in Faith, Worship, and Community in Houston, Texas",
    welcomeEyebrow: "A Word from our Rector",
    welcomeTitle: "Welcome to Anglican Church of the Epiphany, Houston — Texas.",
    welcomeBody:
      "Grace and peace to you in the name of our Lord and Savior Jesus Christ.\n\nIt is my joy and privilege to welcome you to the Anglican Church of the Epiphany, Houston, Texas, a vibrant community of faith where lives are transformed by God’s love, His Word is faithfully preached, and His people are empowered to serve.\n\nWhether you are seeking a deeper relationship with God, looking for a church family, searching for hope in difficult times, or simply exploring the Christian faith, you will find a warm and loving home here. At Epiphany, we believe that every person matters to God and has a unique place in His kingdom.\n\nOur mission is to proclaim the Gospel of Jesus Christ, nurture spiritual growth through worship and discipleship, and extend God’s compassion to our community and beyond. Through heartfelt worship, biblical teaching, prayer, fellowship, and outreach, we strive to reflect the light of Christ in a world that desperately needs His hope.\n\nWe are a diverse and welcoming congregation united by our faith in Jesus Christ and our commitment to living out His teachings. No matter your background, age, or life situation, there is a place for you here.\n\nI personally invite you and your family to join us for worship and experience the joy of Christian fellowship. Come and discover God’s purpose for your life, build meaningful relationships, and grow in faith alongside fellow believers.\n\nWe look forward to welcoming you to the Anglican Church of the Epiphany, where faith comes alive, hope is renewed, and lives are transformed through the power of Jesus Christ.\n\nMay God richly bless you.",
    welcomeName: "The Ven. Dr Isaac Ifedayo Olasehinde",
    welcomeRole:
      "B.Sc., B.Th, MBA, PhD. JP.\nRector\nAnglican Church of the Epiphany\nHouston, Texas",
    welcomeImagePath: "",
    servicesEyebrow: "Join Us",
    servicesTitle: "Service Times",
    servicesIntro: "We gather each week to worship. There's a place for you.",
    ministriesEyebrow: "Get Involved",
    ministriesTitle: "Ministries at Epiphany",
    eventsEyebrow: "What's Happening",
    eventsTitle: "Upcoming Events",
    sermonsEyebrow: "From the Pulpit",
    sermonsTitle: "Latest Sermons",
    givingEyebrow: "Generosity",
    givingTitle: "Give to support the mission",
    givingBody:
      "Your generosity sustains worship, forms disciples, and serves our city. Thank you for partnering with us.",
    testimonialsEyebrow: "Stories of Grace",
    testimonialsTitle: "What our community says",
    testimonials: [],
  },
  about: {
    heroEyebrow: "About Us",
    heroTitle: "A community shaped by ancient faith",
    heroSubtitle:
      "A growing Anglican worshipping family in Houston, rooted in scripture, prayer, and fellowship.",
    heroImagePath: "",
    missionTitle: "To know Christ and make him known.",
    missionBody:
      "We gather to worship Jesus, grow as his disciples, and carry his love into every corner of Houston.",
    visionTitle: "A parish family formed by scripture, sacrament, and love.",
    visionBody: "A multi-generational community where ancient worship meets present-day mission.",
    historyTitle: "A heritage of faithfulness",
    history: [
      {
        id: "10000000-0000-4000-8000-000000000001",
        year: "2024",
        title: "Founding",
        body: "ANGLICAN CHURCH OF THE EPIPHANY, HOUSTON is planted by a small group of families committed to faithful Anglican worship in Houston.",
      },
      {
        id: "10000000-0000-4000-8000-000000000002",
        year: "2026",
        title: "2+ Years On",
        body: "Celebrating 2 years of faith, fellowship, and growth together!",
      },
    ],
    beliefsTitle: "Rooted in scripture, formed by tradition",
    beliefsIntro:
      "We stand within the great stream of historic, orthodox Christianity, worshipping according to the Book of Common Prayer.",
    beliefs: [
      {
        id: "20000000-0000-4000-8000-000000000001",
        title: "Holy Scripture",
        body: "We believe the Bible is the inspired Word of God — the rule and ultimate standard of faith and life.",
      },
      {
        id: "20000000-0000-4000-8000-000000000002",
        title: "Anglican Tradition",
        body: "We worship within the historic stream of the Anglican Communion, shaped by the Book of Common Prayer and the creeds of the Church.",
      },
      {
        id: "20000000-0000-4000-8000-000000000003",
        title: "Worship",
        body: "We gather weekly to encounter the living God through liturgy, scripture, sacrament, and song.",
      },
      {
        id: "20000000-0000-4000-8000-000000000004",
        title: "Sacraments",
        body: "Baptism and Holy Communion are visible signs of God's invisible grace, instituted by Christ for his Church.",
      },
      {
        id: "20000000-0000-4000-8000-000000000005",
        title: "Prayer",
        body: "We are formed as a people of prayer through daily offices, intercession, and silent contemplation.",
      },
    ],
  },
  visit: {
    heroEyebrow: "You are welcome here",
    heroTitle: "Plan Your Visit",
    heroSubtitle:
      "Whether church is familiar or completely new to you, we would be glad to welcome you.",
    heroImagePath: "",
    introEyebrow: "Worship with us",
    introTitle: "Your first Sunday can be simple",
    introBody:
      "Come as you are and join a community gathered around scripture, prayer, worship, and fellowship. If you have questions before you arrive, contact us and a member of the church team will help.",
    expectationsTitle: "What to expect",
    expectations: [
      "Our Anglican worship is shaped by scripture, prayer, and the historic Christian tradition. You are welcome to observe, participate at your own pace, and ask questions afterward.",
      "There is no special dress requirement. Wear what helps you feel comfortable and ready to worship.",
      "Visiting with children or arranging for accessibility needs? Contact us before you come so we can share the most current arrangements and help you plan.",
    ],
    faqTitle: "First-visit questions",
    faqs: [
      {
        id: "30000000-0000-4000-8000-000000000001",
        question: "What should I expect on my first visit?",
        answer:
          "A warm welcome, an Anglican liturgy with scripture, prayer, and Communion, and friendly people happy to answer questions.",
      },
      {
        id: "30000000-0000-4000-8000-000000000002",
        question: "What should I wear?",
        answer:
          "Come as you are — you'll see everything from suits to jeans. We care more that you're here than what you wear.",
      },
      {
        id: "30000000-0000-4000-8000-000000000003",
        question: "Is there childcare?",
        answer:
          "Please contact the church before your visit so our team can share the current arrangements for children and families.",
      },
      {
        id: "30000000-0000-4000-8000-000000000004",
        question: "Where do I park?",
        answer:
          "Use the directions link for our Westheimer Road address. If you need help with parking or the entrance, contact us before you travel.",
      },
      {
        id: "30000000-0000-4000-8000-000000000005",
        question: "Can I ask about accessibility before I come?",
        answer:
          "Yes. Call or email us before your visit and our team will help you plan for your specific access needs.",
      },
    ],
    closingTitle: "We look forward to meeting you",
    closingBody: "Tell us how we can help make your first visit easier.",
  },
  pages: {
    ministries: {
      eyebrow: "Ministries",
      title: "There's a place for you to belong",
      subtitle: "From the youngest to the eldest, we have ministries that gather, form, and send.",
      imagePath: "",
    },
    events: {
      eyebrow: "Events",
      title: "Gather, grow, and serve",
      subtitle: "Find a moment to belong — from Sunday worship to community outreach.",
      imagePath: "",
    },
    sermons: {
      eyebrow: "Sermons",
      title: "Faithful teaching from the Word",
      subtitle: "Browse our sermon library by speaker, series, or Bible passage.",
      imagePath: "",
    },
    gallery: {
      eyebrow: "Gallery",
      title: "Moments from our life together",
      subtitle: "",
      imagePath: "",
    },
    contact: {
      eyebrow: "Contact",
      title: "We'd love to hear from you",
      subtitle: "Plan your visit, ask a question, or share a prayer request.",
      imagePath: "",
    },
    give: {
      eyebrow: "Generosity",
      title: "Support the Mission",
      subtitle: "Your generosity helps our church worship, serve, and share Christ's love.",
      imagePath: "",
    },
  },
  revision: 1,
});
