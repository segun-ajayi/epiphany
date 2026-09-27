// Static editorial content and bundled fallback images. Operational content is database-backed.

import heroChurch from "@/assets/hero-church.jpg";
import churchExterior from "@/assets/church-exterior.jpg";
import congregation from "@/assets/congregation.jpg";
import bible from "@/assets/bible.jpg";
import logo from "@/assets/logoACE-optimized.jpg";

export const IMAGES = { heroChurch, churchExterior, congregation, bible, logo };

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
