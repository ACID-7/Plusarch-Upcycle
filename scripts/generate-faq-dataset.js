/**
 * Generates 2000+ Q&A pairs for Plus Arch Upcycle.
 * Run: node scripts/generate-faq-dataset.js
 * Output: data/ai-training/faq-dataset.json
 */

const fs = require('fs');
const path = require('path');

const INTENTS = ['greeting', 'shipping', 'returns', 'materials', 'care', 'product', 'contact', 'payment', 'order_status'];

// ---- Greeting: many phrasings ----
const greetingQuestions = [
  'Hi', 'Hello', 'Hey', 'Hi there', 'Hello there', 'Hey there', 'Greetings', 'Good morning', 'Good afternoon', 'Good evening', 'Good day',
  'What\'s up', 'What\'s up?', 'Howdy', 'Hiya', 'Yo', 'Heya', 'Morning', 'Afternoon', 'Evening',
  'Hello!', 'Hi!', 'Hey!', 'Hi! I need help', 'Hello can you help', 'Hey I have a question',
  'Good morning!', 'Good afternoon!', 'Good evening!', 'Good night',
  'Hi again', 'Hello again', 'Hey again', 'Hi I\'m back',
  'Is anyone there?', 'Anyone here?', 'Can someone help?', 'Help please', 'I need assistance',
  'Hi I was wondering', 'Hello I have a query', 'Hey quick question',
  'Greetings!', 'Welcome', 'Hi welcome', 'Hello friend', 'Hey friend',
  'Hi team', 'Hello team', 'Hey team', 'Hi Plus Arch', 'Hello Plus Arch',
  'Good morning team', 'Good afternoon team', 'Good evening team',
  'Hi there!', 'Hello there!', 'Hey there!', 'Hi! There', 'Hello! There',
  'Hi can I ask', 'Hello can I ask', 'Hey can I ask', 'Hi I need to ask',
  'Hello I need info', 'Hi I need info', 'Hey I need info',
  'Hi do you have', 'Hello do you have', 'Hey do you have',
  'Hi I\'m interested', 'Hello I\'m interested', 'Hey I\'m interested',
  'Hi I want to know', 'Hello I want to know', 'Hey I want to know',
  'Hi there can you help', 'Hello can you help me', 'Hey can you help me',
  'Hi I\'m looking for', 'Hello I\'m looking for', 'Hey I\'m looking for',
  'Hi I\'d like to know', 'Hello I\'d like to know', 'Hey I\'d like to know',
  'Hi just browsing', 'Hello just browsing', 'Hey just browsing',
  'Hi need help with', 'Hello need help with', 'Hey need help with',
  'Hi quick question', 'Hello quick question', 'Hey quick question',
  'Hi there I have a question', 'Hello there I have a question',
  'Hi good to be here', 'Hello good to be here', 'Hey good to be here',
  'Hi I love your jewelry', 'Hello I love your jewelry', 'Hey I love your jewelry',
  'Hi I saw your site', 'Hello I saw your site', 'Hey I saw your site',
  'Hi from Sri Lanka', 'Hello from Sri Lanka', 'Hey from Sri Lanka',
  'Hi from Colombo', 'Hello from Colombo', 'Hey from Colombo',
  'Hi first time here', 'Hello first time here', 'Hey first time here',
  'Hi I\'m new', 'Hello I\'m new', 'Hey I\'m new', 'Hi new customer', 'Hello new customer',
  'Hi could you help', 'Hello could you help', 'Hey could you help',
  'Hi would you help', 'Hello would you help', 'Hey would you help',
  'Hi I need some info', 'Hello I need some info', 'Hey I need some info',
  'Hi got a question', 'Hello got a question', 'Hey got a question',
  'Hi have a question', 'Hello have a question', 'Hey have a question',
  'Hi asking about', 'Hello asking about', 'Hey asking about',
  'Hi wondering about', 'Hello wondering about', 'Hey wondering about',
  'Hi checking in', 'Hello checking in', 'Hey checking in',
  'Hi just saying hi', 'Hello just saying hello', 'Hey just saying hey',
  'Hi hope you can help', 'Hello hope you can help', 'Hey hope you can help',
  'Hi need to ask something', 'Hello need to ask something', 'Hey need to ask something',
  'Hi could I ask', 'Hello could I ask', 'Hey could I ask',
  'Hi I was asking', 'Hello I was asking', 'Hey I was asking',
  'Hi I wanted to ask', 'Hello I wanted to ask', 'Hey I wanted to ask',
  'Hi I wanted to know', 'Hello I wanted to know', 'Hey I wanted to know',
  'Hi can you tell me', 'Hello can you tell me', 'Hey can you tell me',
  'Hi would like to ask', 'Hello would like to ask', 'Hey would like to ask',
  'Hi need information', 'Hello need information', 'Hey need information',
  'Hi looking for information', 'Hello looking for information', 'Hey looking for information',
  'Hi have an inquiry', 'Hello have an inquiry', 'Hey have an inquiry',
  'Hi inquiry', 'Hello inquiry', 'Hey inquiry', 'Hi question', 'Hello question', 'Hey question',
  'Hi support', 'Hello support', 'Hey support', 'Hi customer service', 'Hello customer service',
  'Hi I need support', 'Hello I need support', 'Hey I need support',
  'Hi chat', 'Hello chat', 'Hey chat', 'Hi bot', 'Hello bot', 'Hey bot',
  'Hi assistant', 'Hello assistant', 'Hey assistant',
  'Hi Plus Arch Upcycle', 'Hello Plus Arch Upcycle', 'Hey Plus Arch Upcycle',
  'Hi upcycle', 'Hello upcycle', 'Hey upcycle', 'Hi jewelry', 'Hello jewelry', 'Hey jewelry',
  'Hi eco', 'Hello eco', 'Hey eco', 'Hi sustainable', 'Hello sustainable', 'Hey sustainable',
];

const greetingAnswers = [
  'Hello! Welcome to Plus Arch Upcycle. I can help with product details, care, shipping, returns, and orders. What would you like to know?',
  'Hi! Thanks for visiting Plus Arch. We make eco-friendly jewelry from upcycled materials. Ask me about our pieces, shipping, or how to care for your jewelry.',
  'Good morning! How can I help you today? I can answer questions about our upcycled jewelry, shipping, returns, or product care.',
  'Hey! Welcome to Plus Arch Upcycle. Need help with jewelry, shipping, or care? Just ask.',
  'Good afternoon! I\'m here to help with our upcycled jewelry, orders, shipping, or returns. What can I help with?',
  'Good evening! Thanks for visiting. Ask me anything about our eco-friendly jewelry, delivery, or care instructions.',
  'Hi! I\'m the Plus Arch assistant. I can help with products, shipping, returns, and care. What do you need?',
  'Hello! Welcome to Plus Arch. We craft jewelry from upcycled materials. How can I help you today?',
  'Hello! I can help with product info, shipping, returns, materials, and care. What would you like to know?',
  'Hey! Welcome. Ask me about our jewelry, delivery times, or how to take care of your pieces.',
  'Greetings! Plus Arch Upcycle is here. I can assist with orders, shipping, returns, and product questions.',
  'Hi there! How can I help? I can answer questions about our upcycled jewelry, shipping, returns, and care.',
  'Hello there! Thanks for visiting. Ask me about products, delivery, or care—I\'m here to help.',
  'Hey there! Welcome to Plus Arch. What would you like to know about our jewelry, shipping, or returns?',
];

// ---- Shipping: templates + cities ----
const cities = [
  // We only deliver within Sri Lanka – focus on local cities and districts
  'Colombo', 'Kandy', 'Galle', 'Jaffna', 'Negombo', 'Anuradhapura', 'Trincomalee', 'Batticaloa', 'Matara', 'Ratnapura',
  'Kurunegala', 'Badulla', 'Gampaha', 'Kalutara', 'Hambantota', 'Vavuniya', 'Kilinochchi', 'Mannar', 'Mullaitivu', 'Ampara',
  'Polonnaruwa', 'Monaragala', 'Kegalle', 'Puttalam', 'Sri Lanka',
];

const shippingPairs = [
  {
    q: 'How long does shipping take?',
    a: 'Delivery within Sri Lanka typically takes around 3–7 business days from the time we confirm your order on WhatsApp. Exact timing can vary a little by area and courier.',
  },
  {
    q: 'Do you ship internationally?',
    a: 'We currently only deliver within Sri Lanka. If you are outside Sri Lanka, you can still browse our designs, but we cannot ship internationally right now.',
  },
  {
    q: 'How much is delivery?',
    a: 'Delivery fees depend on your area within Sri Lanka and the order size. When you place an order via WhatsApp, we\'ll confirm the delivery fee with you before you pay.',
  },
  {
    q: 'Can I track my order?',
    a: 'We don\'t have an online tracking page. To check the status of your delivery, please contact us via WhatsApp or live chat with your name and order details.',
  },
  {
    q: 'When will my order be dispatched?',
    a: 'Orders are usually sent out within 1–2 business days after we confirm your order and payment via WhatsApp. Delivery across Sri Lanka is then around 3–7 business days.',
  },
  {
    q: 'Do you offer free shipping?',
    a: 'Free or discounted delivery depends on current offers and your order size. When you message us on WhatsApp to place an order, we\'ll let you know the delivery fee.',
  },
  {
    q: 'What courier do you use?',
    a: 'We use reliable local courier partners within Sri Lanka. If you need more details for your area, contact us on WhatsApp when placing your order.',
  },
  {
    q: 'How is my order packaged?',
    a: 'We use eco-friendly packaging and pack each piece securely so it arrives safely.',
  },
  {
    q: 'How fast can I get my order?',
    a: 'Most deliveries within Sri Lanka arrive in about 3–7 business days after we confirm your order and payment on WhatsApp.',
  },
  {
    q: 'Eco packaging?',
    a: 'Yes. We use eco-friendly, minimal packaging while still keeping your jewelry safe during delivery.',
  },
  {
    q: 'Can I get my order tomorrow?',
    a: 'Standard delivery within Sri Lanka is around 3–7 business days. If you need something urgently, message us on WhatsApp and we\'ll tell you what is possible for your area.',
  },
  {
    q: 'How many days for shipping?',
    a: 'Across Sri Lanka, most orders take around 3–7 business days to arrive once we confirm payment on WhatsApp.',
  },
  {
    q: 'Do you deliver to my address?',
    a: 'We deliver across Sri Lanka. When you message us on WhatsApp, share your address and we will confirm if delivery is available and the fee.',
  },
  {
    q: 'Shipping cost to my city?',
    a: 'Delivery fees depend on your city in Sri Lanka. Send us a WhatsApp message with your city and items you want, and we\'ll confirm the delivery cost before you pay.',
  },
  {
    q: 'Package lost?',
    a: 'If your order seems late, contact us via WhatsApp or live chat with your name and order details. We\'ll check with the courier and update you.',
  },
  {
    q: 'Delayed delivery?',
    a: 'If it has been more than about a week since we confirmed your order, please reach out on WhatsApp or live chat with your details so we can check the status for you.',
  },
];

// ---- Returns ----
const returnsPairs = [
  { q: 'What is your return policy?', a: 'We offer a 30-day return policy for unused items in original condition. Due to the handmade nature of our products, some items may not be returnable—please check individual product descriptions.' },
  { q: 'How do I return an item?', a: 'Contact us via WhatsApp or email to start a return. Items must be unused and in original condition. We\'ll guide you through the process and arrange refund or exchange.' },
  { q: 'Do you offer refunds?', a: 'Yes. Unused items in original condition can be refunded within 30 days. Refunds are processed to the original payment method. Some handmade or custom items may be non-returnable.' },
  { q: 'Can I exchange my order?', a: 'Yes. Contact us within 30 days with the item unused and in original condition. We can arrange an exchange for size, style, or another product.' },
  { q: 'I want to cancel my order', a: 'If your order hasn\'t shipped yet, contact us right away and we\'ll try to cancel it. Once shipped, you can use our return process after delivery.' },
  { q: 'Item arrived damaged', a: 'We\'re sorry to hear that. Please contact us with your order number and a photo. We\'ll arrange a replacement or refund.' },
  { q: 'Wrong item received', a: 'Contact us with your order number and what you received. We\'ll arrange the correct item or a full refund.' },
  { q: 'How long do refunds take?', a: 'Refunds are processed to the original payment method once we receive the return. It may take a few business days to appear depending on your bank or card.' },
  { q: 'Can I return custom jewelry?', a: 'Custom or personalised pieces may not be returnable due to their one-of-a-kind nature. Check the product page or contact us before ordering.' },
  { q: 'Return shipping cost?', a: 'Return shipping is usually the customer\'s responsibility unless the error was on our side (e.g. wrong or damaged item). We\'ll confirm when you contact us.' },
  { q: 'Do you accept exchanges?', a: 'Yes. Within 30 days, unused items in original condition can be exchanged. Contact us to start the process.' },
  { q: 'Refund policy for bracelets?', a: 'Same as other items: 30-day returns for unused pieces in original condition. Custom or sale items may have different terms—check the product page.' },
  { q: 'I need to replace a ring', a: 'Contact us with your order number. If it\'s within 30 days and unused, we can arrange an exchange for size or style.' },
  { q: 'Return policy?', a: '30-day returns for unused items in original condition. Some handmade or custom items may be non-returnable. Check product pages for details.' },
  { q: 'How to return?', a: 'Contact us via WhatsApp or email. We\'ll guide you. Items must be unused and in original condition.' },
  { q: 'Can I get a refund?', a: 'Yes, for unused items in original condition within 30 days. Refunds go to the original payment method.' },
  { q: 'Exchange policy?', a: 'We accept exchanges within 30 days for unused items in original condition. Contact us to arrange.' },
  { q: 'Cancel order?', a: 'If not yet shipped, contact us immediately to request cancellation. Once shipped, returns apply.' },
  { q: 'Item broken', a: 'Contact us with your order number and a photo. We\'ll arrange a replacement or refund.' },
  { q: 'Received wrong size', a: 'Contact us for an exchange within 30 days. Item must be unused and in original condition.' },
  { q: 'Not satisfied can I return?', a: 'Yes, if the item is unused and in original condition within 30 days. Contact us to start a return.' },
  { q: 'Return window?', a: '30 days from delivery for unused items in original condition. Some items may be non-returnable—check the product page.' },
  { q: 'Who pays return shipping?', a: 'Return shipping is typically the customer\'s responsibility unless we sent the wrong or damaged item.' },
  { q: 'Refund timeframe?', a: 'Refunds are processed after we receive the return. It may take a few business days to show on your card or bank.' },
  { q: 'Can I return a ring?', a: 'Rings can be returned within 30 days if unused and in original condition. Custom rings may be non-returnable.' },
  { q: 'Can I return earrings?', a: 'Earrings can be returned within 30 days if unused and in original condition. Hygiene may restrict some earrings—check the product page.' },
  { q: 'Return necklace?', a: 'Yes, within 30 days if unused and in original condition. Contact us to start the return.' },
  { q: 'Damaged in transit', a: 'Contact us with your order number and photos. We\'ll arrange a replacement or full refund.' },
  { q: 'I want my money back', a: 'We offer refunds for unused items in original condition within 30 days. Contact us to start the process.' },
  { q: 'Return form?', a: 'Contact us via WhatsApp or email and we\'ll guide you through the return—no separate form required.' },
  { q: 'Exchange for different size?', a: 'Yes. Contact us within 30 days with the item unused. We can arrange a size exchange where possible.' },
  { q: 'Exchange for different style?', a: 'Yes. Within 30 days, unused items can be exchanged for another style. Contact us to arrange.' },
];

// ---- Materials ----
const materialsPairs = [
  { q: 'What materials do you use?', a: 'We use recycled metals (silver, gold-plated), upcycled crystals and beads, sustainable leather alternatives, and other eco-friendly materials. All materials are sourced responsibly.' },
  { q: 'Are your products hypoallergenic?', a: 'Most pieces use sterling silver or gold-plated materials, which are generally hypoallergenic. If you have known metal allergies, we recommend checking with a healthcare professional or asking us about specific materials.' },
  { q: 'Is the jewelry real silver?', a: 'We use recycled sterling silver and gold-plated options. Product pages specify the materials for each piece. All metals are sourced from sustainable or recycled sources.' },
  { q: 'What does upcycled mean?', a: 'Upcycled means we give existing materials a new life instead of throwing them away. We use reclaimed metals, beads, and other elements to create unique, eco-friendly jewelry.' },
  { q: 'Do you use real gold?', a: 'We use gold-plated and recycled metal options. Each product page states whether a piece is gold-plated or sterling silver. We don\'t use newly mined gold for sustainability.' },
  { q: 'Where do your materials come from?', a: 'We source recycled and upcycled materials from responsible suppliers. Metals, beads, and other elements are reclaimed or recycled to reduce environmental impact.' },
  { q: 'Are the beads natural?', a: 'We use a mix of natural and upcycled beads. Product descriptions specify materials. Many pieces use natural stones or recycled glass beads.' },
  { q: 'Is it sustainable?', a: 'Yes. We focus on recycled metals, upcycled materials, and responsible sourcing to make our jewelry as sustainable as possible.' },
  { q: 'What metal is this ring?', a: 'Materials are listed on each product page—e.g. recycled sterling silver or gold-plated. If you tell me the product name I can help you confirm.' },
  { q: 'Do you use recycled silver?', a: 'Yes. We use recycled sterling silver in many of our pieces. This reduces the need for newly mined silver and supports sustainability.' },
  { q: 'Are materials eco-friendly?', a: 'We prioritise eco-friendly and recycled materials: recycled metals, upcycled beads and crystals, and sustainable alternatives where we can.' },
  { q: 'What are the stones made of?', a: 'We use natural stones, recycled glass, and upcycled crystals depending on the design. Check the product page for the specific materials.' },
  { q: 'Nickel free?', a: 'Our sterling silver and gold-plated pieces are typically nickel-free or low nickel. If you have allergies, check the product details or ask us before buying.' },
  { q: 'Sterling silver?', a: 'Yes. We use recycled sterling silver in many pieces. Product pages specify the materials.' },
  { q: 'Gold plated?', a: 'We offer gold-plated options. Each product page states the finish. We use recycled or responsible sources where possible.' },
  { q: 'What is upcycled jewelry?', a: 'Upcycled jewelry is made from existing materials—reclaimed metals, beads, crystals—given new life instead of discarded. It\'s eco-friendly and often unique.' },
  { q: 'Recycled metals?', a: 'Yes. We use recycled sterling silver and other recycled metals to reduce mining and support sustainability.' },
  { q: 'Are your materials ethical?', a: 'We focus on recycled and upcycled materials and responsible sourcing to keep our supply chain as ethical and sustainable as possible.' },
  { q: 'Lead free?', a: 'We don\'t use lead in our jewelry. Materials are specified on each product page.' },
  { q: 'Copper in your jewelry?', a: 'Some pieces may use copper or copper alloys. Check the product page for exact materials, especially if you have sensitivities.' },
  { q: 'Brass?', a: 'Some designs may use brass. Product descriptions list materials. We prioritise recycled and hypoallergenic options.' },
  { q: 'Natural stones?', a: 'We use natural stones in many designs, along with recycled glass and upcycled crystals. See the product page for each piece.' },
  { q: 'Recycled glass?', a: 'Yes. We use recycled glass beads and elements in some designs. Product descriptions specify materials.' },
  { q: 'Eco friendly materials?', a: 'Yes. We use recycled metals, upcycled beads and crystals, and other eco-friendly materials where possible.' },
  { q: 'Where do you source materials?', a: 'We source from suppliers that provide recycled and upcycled materials. We prioritise responsibility and sustainability.' },
  { q: 'Hypoallergenic jewelry?', a: 'Most of our pieces use sterling silver or gold-plated materials, which are generally hypoallergenic. Check product details or ask us if you have allergies.' },
  { q: 'What kind of silver?', a: 'We use recycled sterling silver. Product pages specify the exact material for each piece.' },
  { q: 'Rose gold?', a: 'We may have rose gold-plated options. Browse the shop or check product pages for current finishes.' },
  { q: 'Plating quality?', a: 'We use quality plating. Care instructions are on product pages. Plated pieces may need re-plating over time with heavy wear.' },
  { q: 'Vermeil?', a: 'Some pieces may be vermeil (gold over sterling silver). Check the product description for details.' },
];

// ---- Care ----
const carePairs = [
  { q: 'How do I care for my jewelry?', a: 'Care varies by piece. Generally, avoid water and chemicals, store in a jewelry box, and clean with a soft cloth. Specific care instructions are included with each purchase.' },
  { q: 'Can I wear the rings in the shower?', a: 'We recommend removing jewelry before showering, swimming, or using lotions to keep it in best condition. Sterling silver and plated pieces can tarnish with prolonged moisture.' },
  { q: 'How do I clean silver jewelry?', a: 'Use a soft, dry cloth for regular cleaning. For deeper cleaning, a mild soap and water rinse followed by drying is fine. Avoid harsh chemicals and abrasive cloths.' },
  { q: 'How to store bracelets?', a: 'Store in a dry place, ideally in a jewelry box or pouch to avoid scratches and tangling. Keep away from humidity and direct sunlight.' },
  { q: 'My silver turned dark', a: 'Silver can tarnish with exposure to air and moisture. Gently polish with a soft cloth or a silver cleaning cloth. Avoid harsh chemicals.' },
  { q: 'Can I use perfume with your jewelry?', a: 'Apply perfume before putting on jewelry, and avoid spraying it directly on pieces. Chemicals in perfumes can affect plating and some stones.' },
  { q: 'How to maintain gold plated jewelry?', a: 'Keep it dry, avoid chemicals and abrasives, and store separately. Wipe with a soft cloth after wear to slow tarnishing. It may need re-plating over time.' },
  { q: 'Care for bead necklaces?', a: 'Avoid water and chemicals. Wipe with a soft, dry cloth. Store flat or hung to avoid stretching the thread. Keep away from sharp objects.' },
  { q: 'How to prevent tarnishing?', a: 'Store in a dry place, avoid prolonged moisture and chemicals, and wipe with a soft cloth after wear. Anti-tarnish strips in your jewelry box can help.' },
  { q: 'Can I swim with your jewelry?', a: 'We don\'t recommend it. Chlorine and salt water can damage metals and plating. Remove jewelry before swimming or bathing.' },
  { q: 'How to clean gold plated?', a: 'Use a soft, dry or slightly damp cloth. Avoid abrasive or chemical cleaners. Store in a dry place when not worn.' },
  { q: 'Best way to store rings?', a: 'Store in a jewelry box or soft pouch, separate from other pieces to avoid scratches. Keep away from humidity and direct sunlight.' },
  { q: 'Jewelry care tips?', a: 'Avoid water and chemicals, store properly, clean with a soft cloth. Specific instructions come with each piece.' },
  { q: 'Can I sleep with jewelry on?', a: 'We recommend removing jewelry before sleep to avoid snagging, tangling, or damage. It also helps reduce tarnishing.' },
  { q: 'How to clean bracelets?', a: 'Wipe with a soft, dry cloth. For metal bracelets, a mild soap and water rinse is fine. Avoid harsh chemicals. Dry thoroughly.' },
  { q: 'How to clean earrings?', a: 'Wipe with a soft, dry cloth. Avoid submerging in water if they have glue or delicate elements. Check product care instructions.' },
  { q: 'Storage for necklaces?', a: 'Store in a jewelry box or hang to avoid tangling. Keep away from humidity and direct sunlight.' },
  { q: 'Tarnish removal?', a: 'Use a soft cloth or a silver polishing cloth. Avoid harsh chemicals. For severe tarnish, consider a professional cleaner.' },
  { q: 'Waterproof jewelry?', a: 'Our jewelry is not designed to be worn in water. Remove before showering, swimming, or washing hands to preserve it.' },
  { q: 'Care instructions?', a: 'Care varies by piece. Generally: avoid water and chemicals, store in a dry place, clean with a soft cloth. Details come with each order.' },
  { q: 'How to take care of rings?', a: 'Remove before showering or using chemicals. Store in a pouch or box. Clean with a soft cloth. Avoid knocking against hard surfaces.' },
  { q: 'Polish silver?', a: 'Use a soft cloth or a silver polishing cloth. For light tarnish, gentle rubbing is enough. Avoid abrasive or chemical polishes on plated items.' },
  { q: 'Lotion and jewelry?', a: 'Apply lotion before putting on jewelry, and avoid getting lotion on pieces. Chemicals can affect plating and some stones.' },
  { q: 'Sweat and jewelry?', a: 'Wipe pieces with a soft cloth after wear if you sweat. Avoid leaving them on during heavy exercise or in humid conditions for long periods.' },
  { q: 'Care for chains?', a: 'Store untangled, avoid pulling. Wipe with a soft cloth. Keep away from chemicals and moisture.' },
  { q: 'Oxidation on silver?', a: 'Silver can oxidise (darken) with exposure. Polish with a soft or silver cloth. It\'s normal and can be cleaned.' },
  { q: 'Re-plating?', a: 'Gold-plated pieces may need re-plating after long-term wear. We don\'t offer re-plating; you can seek a local jeweller for that service.' },
  { q: 'Care for crystals?', a: 'Wipe gently with a soft, dry cloth. Avoid water and chemicals. Store so they don\'t knock against harder materials.' },
  { q: 'Care for pearls?', a: 'If we use pearl or pearl-like elements, wipe with a dry cloth and avoid chemicals and water. Store separately to avoid scratches.' },
  { q: 'Anti-tarnish?', a: 'Store in a dry place and use anti-tarnish strips or pouches in your jewelry box to slow tarnishing.' },
];

// ---- Product: types and styles ----
const productTypes = [
  'rings', 'necklaces', 'bracelets', 'earrings', 'pendants', 'anklets', 'chains', 'brooches', 'hair pins', 'cufflinks',
  'silver rings', 'gold rings', 'statement rings', 'minimal rings', 'cocktail rings', 'stackable rings', 'signet rings',
  'silver necklaces', 'gold necklaces', 'chokers', 'long necklaces', 'layered necklaces', 'pendant necklaces', 'chain necklaces',
  'silver bracelets', 'bead bracelets', 'bangles', 'cuffs', 'tennis bracelets', 'charm bracelets',
  'stud earrings', 'hoop earrings', 'drop earrings', 'dangle earrings', 'silver earrings', 'gold earrings',
  'wedding rings', 'engagement rings', 'commitment rings', 'promise rings', 'men\'s rings', 'women\'s rings',
  'unisex jewelry', 'men\'s jewelry', 'women\'s jewelry', 'kids jewelry', 'bridal jewelry',
  'minimalist jewelry', 'statement jewelry', 'bohemian jewelry', 'vintage style jewelry', 'modern jewelry', 'classic jewelry',
  'eco jewelry', 'sustainable jewelry', 'handmade jewelry', 'custom jewelry', 'personalised jewelry',
  'gift sets', 'matching sets', 'earring and necklace sets', 'ring and bracelet sets',
  'rose gold pieces', 'sterling silver pieces', 'gold plated pieces', 'bead jewelry', 'crystal jewelry',
  'upcycled rings', 'upcycled necklaces', 'upcycled bracelets', 'upcycled earrings', 'recycled silver jewelry',
  'gemstone rings', 'birthstone jewelry', 'turquoise jewelry', 'amber jewelry', 'pearl jewelry',
  'geometric jewelry', 'nature inspired jewelry', 'leaf jewelry', 'flower jewelry', 'star jewelry',
  'initial jewelry', 'name jewelry', 'monogram jewelry', 'engraved jewelry', 'personalized rings',
  'thin rings', 'wide bands', 'midi rings', 'thumb rings', 'toe rings',
  'long earrings', 'short earrings', 'clip earrings', 'threader earrings', 'huggie earrings',
  'delicate necklaces', 'bold necklaces', 'simple necklaces', 'layered bracelets', 'single bracelets',
  'ankle bracelets', 'body chains', 'hair jewelry', 'scarf rings', 'key chains',
  'jewelry boxes', 'gift cards', 'vouchers', 'discount codes', 'sale items',
  'new arrivals', 'bestsellers', 'limited edition', 'exclusive pieces', 'one of a kind',
];

const productPairs = [
  { q: 'Do you have rings?', a: 'Yes, we have a range of rings made from upcycled and recycled materials. You can browse by category on our shop page or ask for a specific style.' },
  { q: 'What necklaces do you have?', a: 'We offer various necklaces including recycled silver chains and upcycled bead designs. Check the shop for current styles and materials.' },
  { q: 'Do you do custom orders?', a: 'Yes. Contact us through the inquiry form or WhatsApp with your style, colors, and budget. We\'ll help you create a one-of-a-kind upcycled piece.' },
  { q: 'Are your pieces handmade?', a: 'Yes. Our jewelry is handcrafted using upcycled and recycled materials. Each piece is made with care in our workshop.' },
  { q: 'Do you have earrings?', a: 'Yes, we have earrings in various styles using recycled metals and upcycled elements. Browse the shop or filter by category.' },
  { q: 'Do you sell bracelets?', a: 'Yes. We have bracelets made from recycled silver, beads, and other upcycled materials. Check the shop for current designs.' },
  { q: 'What sizes do rings come in?', a: 'Sizes depend on the design. Product pages and variants show available sizes. Need a specific size? Contact us—we may be able to adjust or suggest a style.' },
  { q: 'Do you have mens jewelry?', a: 'We have unisex and men\'s styles including rings, bracelets, and chains. Browse the shop or contact us for recommendations.' },
  { q: 'Gift wrapping available?', a: 'We can often arrange gift packaging. Contact us before or at checkout and we\'ll do our best to accommodate.' },
  { q: 'Are these good as gifts?', a: 'Yes. Our upcycled jewelry makes a thoughtful, eco-friendly gift. We can help with gift options or custom pieces—just ask.' },
  { q: 'Do you have wedding rings?', a: 'We have rings that can work as wedding or commitment rings. For custom pairs or specific designs, contact us with your ideas.' },
  { q: 'What styles do you have?', a: 'We offer a range of styles: minimal, statement, bohemian, and classic, using recycled and upcycled materials. Browse the shop by category to explore.' },
  { q: 'How are your products made?', a: 'All our jewelry is handcrafted using upcycled and recycled materials. We source responsibly and give materials new life through our designs.' },
  { q: 'Do you have pendants?', a: 'Yes. We have pendants and necklaces with various pendants. Check the shop for current designs and materials.' },
  { q: 'Is each piece unique?', a: 'Many pieces are one-of-a-kind or made in small batches due to upcycled materials. Product descriptions indicate when a design is unique or limited.' },
  { q: 'Do you have anklets?', a: 'We may have anklets or can suggest similar styles. Browse the shop or contact us and we can point you to the right piece.' },
  { q: 'Can I get a matching set?', a: 'We have coordinating pieces, and custom orders can include matching sets. Tell us what you have in mind via the inquiry form or WhatsApp.' },
  { q: 'What\'s your best seller?', a: 'Popular items vary. Browse the shop for current favourites, or tell us what you like (e.g. rings, necklaces) and we can suggest options.' },
  { q: 'Do you have minimalist jewelry?', a: 'Yes. We have minimal designs in recycled silver and simple forms. Filter or browse the shop for minimal styles.' },
  { q: 'Do you have statement pieces?', a: 'Yes. We have statement jewelry in various styles. Browse the shop for bold rings, necklaces, and earrings.' },
  { q: 'Handcrafted?', a: 'Yes. All our jewelry is handcrafted using upcycled and recycled materials in our workshop.' },
  { q: 'One of a kind?', a: 'Many of our pieces are one-of-a-kind or limited due to upcycled materials. Product pages indicate when that\'s the case.' },
  { q: 'Custom design?', a: 'Yes. Contact us via the inquiry form or WhatsApp with your ideas, style, and budget for a custom upcycled piece.' },
  { q: 'Gift ideas?', a: 'Our jewelry makes a great eco-friendly gift. Browse the shop or ask us for recommendations by occasion or budget.' },
  { q: 'Bridal collection?', a: 'We have rings and pieces that work for bridal wear. For custom bridal sets, contact us with your preferences.' },
  { q: 'Do you have chokers?', a: 'We may have choker-style necklaces. Browse the shop or contact us and we can suggest similar styles.' },
  { q: 'Do you have hoops?', a: 'We have hoop earrings and similar styles. Check the shop for current designs.' },
  { q: 'Do you have studs?', a: 'We have stud earrings and minimal styles. Browse the earrings category.' },
  { q: 'Price range?', a: 'Prices vary by piece. Browse the shop—each product shows the price in LKR.' },
  { q: 'Do you have sales?', a: 'Promotions vary. Check the website or follow us on social media for updates on sales and new arrivals.' },
  { q: 'New arrivals?', a: 'New pieces are added regularly. Browse the shop or follow us on Instagram for the latest.' },
  { q: 'In stock?', a: 'Availability is shown on each product page. If something is out of stock, contact us—we may restock or suggest alternatives.' },
  { q: 'Back in stock?', a: 'Restocks vary. Contact us or check the product page. We can sometimes notify you when an item is back.' },
  { q: 'Do you do wholesale?', a: 'Contact us via email or WhatsApp to discuss wholesale or bulk orders.' },
  { q: 'Collaborations?', a: 'For collaboration or partnership inquiries, contact us via email or WhatsApp.' },
];

// ---- Contact ----
const contactPairs = [
  { q: 'How can I contact you?', a: 'You can reach us via WhatsApp, email (plusarch.lk@gmail.com), or the inquiry form on the website. Business hours: Mon–Fri 9AM–6PM, Sat 10AM–4PM.' },
  { q: 'What is your WhatsApp number?', a: 'You can contact us on WhatsApp at +94 774442642. We\'re happy to help with product questions, custom orders, and support.' },
  { q: 'What\'s your email?', a: 'Our email is plusarch.lk@gmail.com. We respond during business hours: Mon–Fri 9AM–6PM, Sat 10AM–4PM.' },
  { q: 'When are you open?', a: 'Business hours: Mon–Fri 9AM–6PM, Sat 10AM–4PM. You can message anytime via WhatsApp or email; we\'ll reply when we\'re open.' },
  { q: 'How do I reach support?', a: 'Reach us on WhatsApp (+94 774442642), email (plusarch.lk@gmail.com), or the website inquiry form. We\'ll get back to you as soon as we can.' },
  { q: 'Do you have a physical store?', a: 'We operate mainly online. For visits or pickup, contact us via WhatsApp or email and we can confirm if that\'s possible.' },
  { q: 'Instagram?', a: 'Yes. Find us on Instagram at plusarch_upcycle. We post new designs and behind-the-scenes there.' },
  { q: 'Where are you located?', a: 'We\'re based in Sri Lanka and ship locally and internationally. For a physical address or pickup, contact us via WhatsApp or email.' },
  { q: 'Phone number?', a: 'The best way to reach us is WhatsApp at +94 774442642 or email at plusarch.lk@gmail.com.' },
  { q: 'Customer service?', a: 'Reach customer service via WhatsApp (+94 774442642), email (plusarch.lk@gmail.com), or the website inquiry form.' },
  { q: 'Business hours?', a: 'Mon–Fri 9AM–6PM, Sat 10AM–4PM. You can message anytime; we reply during these hours.' },
  { q: 'Facebook?', a: 'Yes. Find us on Facebook at plusarchupcycle. We post updates and new designs there.' },
  { q: 'Social media?', a: 'We\'re on Instagram (plusarch_upcycle) and Facebook (plusarchupcycle). Links are on the website.' },
  { q: 'Reply time?', a: 'We aim to reply within one business day. For urgent queries, WhatsApp is often the fastest.' },
  { q: 'How to get in touch?', a: 'WhatsApp +94 774442642, email plusarch.lk@gmail.com, or the inquiry form on the website.' },
  { q: 'Contact for custom order?', a: 'Use the inquiry form or WhatsApp (+94 774442642) with your style, colours, and budget. We\'ll help design your piece.' },
  { q: 'Support email?', a: 'plusarch.lk@gmail.com. We respond during business hours.' },
  { q: 'WhatsApp available?', a: 'Yes. Contact us on WhatsApp at +94 774442642.' },
  { q: 'Visit your workshop?', a: 'We mainly operate online. For a visit or pickup, contact us via WhatsApp or email to check availability.' },
  { q: 'Address?', a: 'We\'re based in Sri Lanka. For a physical address or pickup, contact us via WhatsApp or email.' },
];

// ---- Payment ----
const paymentPairs = [
  {
    q: 'What payment methods do you accept?',
    a: 'Orders are placed via WhatsApp from our website. We currently accept payment mainly by bank transfer within Sri Lanka. When you message us to order, we\'ll share our bank details and the total amount.',
  },
  {
    q: 'Can I pay on delivery?',
    a: 'We do not use an online checkout or card gateway. Payment is usually done in advance by bank transfer after we confirm your order on WhatsApp.',
  },
  {
    q: 'Do you accept card payments?',
    a: 'Right now we don\'t process online card payments. After you click “Buy” on the website and open WhatsApp, we\'ll confirm your order and share bank transfer details in LKR.',
  },
  {
    q: 'Is payment secure?',
    a: 'We confirm your order and total directly with you on WhatsApp, then share our official bank account details. Always use the bank details we send from our official number.',
  },
  {
    q: 'Payment in LKR?',
    a: 'Yes. All payments are done in LKR by bank transfer within Sri Lanka. We\'ll confirm the final total and bank details on WhatsApp before you pay.',
  },
  {
    q: 'Bank transfer?',
    a: 'Yes. Bank transfer is our main payment method. Once you confirm your order on WhatsApp, we\'ll send you our bank details and the amount to transfer.',
  },
  {
    q: 'Payment options?',
    a: 'We currently accept orders via WhatsApp and take payment mainly through bank transfer within Sri Lanka. We\'ll guide you step by step in chat.',
  },
  {
    q: 'Payment when?',
    a: 'After you click buy and open WhatsApp, we confirm your items, delivery fee, and then ask you to pay by bank transfer before we send the order.',
  },
  {
    q: 'Invoice?',
    a: 'If you need an invoice or payment proof, let us know on WhatsApp after you complete the bank transfer and we\'ll share the details.',
  },
  {
    q: 'Receipt?',
    a: 'We can share a simple receipt or confirmation via WhatsApp once your bank transfer is received. Just ask us in chat.',
  },
];

// ---- Order status ----
const orderStatusPairs = [
  {
    q: 'Where is my order?',
    a: 'To check your order, please contact us via WhatsApp or live chat with your name and what you ordered. We don\'t have an online tracking page, so we check the courier and update you manually.',
  },
  {
    q: 'How do I check my order status?',
    a: 'Send us a message on WhatsApp or use live chat with your name, mobile number, and order details. We\'ll check with the courier and let you know the latest status.',
  },
  {
    q: 'Has my order shipped?',
    a: 'Most orders are sent within 1–2 business days after we confirm your bank transfer. If you are unsure, contact us on WhatsApp or live chat and we\'ll confirm whether it has been sent.',
  },
  {
    q: 'When will I get my order?',
    a: 'Within Sri Lanka, delivery is usually around 3–7 business days from the time we send your parcel. If it feels late, just contact us on WhatsApp and we\'ll check the status for you.',
  },
  {
    q: 'Order not received',
    a: 'If it has been more than about a week since we confirmed your order, please message us via WhatsApp or live chat with your details. We\'ll follow up with the courier and update you.',
  },
  {
    q: 'Order delayed?',
    a: 'Delays can happen with couriers. Share your name and order details on WhatsApp or live chat and we\'ll manually check the status and next steps.',
  },
  {
    q: 'Change delivery address?',
    a: 'If we haven\'t sent your parcel yet, we may be able to change the address. Contact us as soon as possible on WhatsApp with your current and new address.',
  },
  {
    q: 'Order confirmation?',
    a: 'We confirm your order directly in WhatsApp after you click “Buy” on the website. If you are unsure whether your order is confirmed, send us a message and we\'ll check.',
  },
  {
    q: 'Lost order?',
    a: 'If you think your parcel is lost, contact us via WhatsApp or live chat with your name and order details. We\'ll check with the courier and help resolve it.',
  },
  {
    q: 'How to track?',
    a: 'We don\'t provide an online tracking code. To track your order, please message us on WhatsApp or live chat and we\'ll check the courier and let you know the latest update.',
  },
];

// ---- Build dataset ----
function addPair(pairs, seen, intent, question, answer) {
  const key = (intent + '|' + question.trim().toLowerCase()).replace(/\s+/g, ' ');
  if (seen.has(key)) return;
  seen.add(key);
  pairs.push({ intent, question: question.trim(), answer: answer.trim() });
}

function generate() {
  const pairs = [];
  const seen = new Set();

  // Greeting: each question with rotating answer
  greetingQuestions.forEach((q, i) => {
    const a = greetingAnswers[i % greetingAnswers.length];
    addPair(pairs, seen, 'greeting', q, a);
  });

  // Shipping: base pairs + "Do you ship to {city}?" and "How long to {city}?"
  shippingPairs.forEach(({ q, a }) => addPair(pairs, seen, 'shipping', q, a));
  const shippingCityAnswers = [
    (c) =>
      'Yes, we deliver to ' +
      c +
      ' within Sri Lanka. Delivery is usually around 3–7 business days after we confirm your order and payment via WhatsApp. We\'ll tell you the exact delivery fee when you place your order.',
    (c) =>
      'We can send orders to ' +
      c +
      ' in Sri Lanka. Most parcels arrive in about a week. When you message us on WhatsApp to order, we\'ll confirm delivery time and fee for your area.',
    (c) =>
      'Delivery to ' +
      c +
      ' is available within Sri Lanka and normally takes around 3–7 business days. Please contact us on WhatsApp with your items so we can confirm the delivery charge.',
    (c) =>
      'Yes, we deliver to ' +
      c +
      ' in Sri Lanka. Delivery timing and fee are confirmed directly with you on WhatsApp when you place the order.',
  ];
  const shippingCityQuestions = [
    (c) => `Do you ship to ${c}?`, (c) => `Shipping to ${c}?`, (c) => `How long to ${c}?`, (c) => `Do you deliver to ${c}?`,
    (c) => `Can you ship to ${c}?`, (c) => `Delivery to ${c}?`, (c) => `Ship to ${c}?`, (c) => `Do you send to ${c}?`,
    (c) => `How long for delivery to ${c}?`, (c) => `Shipping time to ${c}?`, (c) => `How much to ship to ${c}?`,
  ];
  cities.forEach((city, i) => {
    shippingCityQuestions.forEach((qTpl, j) => {
      addPair(pairs, seen, 'shipping', qTpl(city), shippingCityAnswers[(i + j) % shippingCityAnswers.length](city));
    });
  });

  // Returns
  returnsPairs.forEach(({ q, a }) => addPair(pairs, seen, 'returns', q, a));
  const returnsPhrasings = [
    'Can I return?', 'Returns?', 'Return?', 'Refund?', 'Refunds?', 'Exchange?', 'Exchanges?', 'Cancel?', 'Cancellation?',
    'Return item?', 'Return order?', 'Send back?', 'Send it back?', 'Get refund?', 'Request refund?', 'Request return?',
    '30 day return?', 'Return period?', 'Return policy?', 'Refund policy?', 'Exchange policy?',
    'I want to return', 'Need to return', 'How to get refund', 'Return process', 'Return procedure',
    'Unhappy with order', 'Change my mind', 'Wrong item', 'Defective', 'Broken item', 'Not as described',
    'Return shipping', 'Who pays return', 'Return cost', 'Send back item', 'Exchange item', 'Replace item',
  ];
  const returnsAnswers = [
    'We offer a 30-day return policy for unused items in original condition. Some handmade or custom items may be non-returnable. Contact us via WhatsApp or email to start a return.',
    'Yes. Unused items in original condition can be returned within 30 days. Contact us to start the process. Refunds go to the original payment method.',
    'Returns and exchanges are available within 30 days for unused items. Contact us via WhatsApp or email and we\'ll guide you.',
  ];
  returnsPhrasings.forEach((q, i) => addPair(pairs, seen, 'returns', q, returnsAnswers[i % returnsAnswers.length]));

  // Materials
  materialsPairs.forEach(({ q, a }) => addPair(pairs, seen, 'materials', q, a));
  const materialsPhrasings = [
    'Materials?', 'What materials?', 'Which materials?', 'Eco materials?', 'Sustainable?', 'Recycled?', 'Upcycled?',
    'Silver?', 'Gold?', 'Metal?', 'Hypoallergenic?', 'Allergy?', 'Nickel?', 'Lead?', 'Ethical?', 'Sourcing?',
    'What metal?', 'What metals?', 'Real silver?', 'Real gold?', 'Gold plated?', 'Sterling?', 'Plating?',
    'Beads material?', 'Stone material?', 'Crystals?', 'Eco friendly?', 'Environmentally friendly?',
    'Responsible sourcing?', 'Where materials from?', 'Material quality?', 'Safe materials?',
  ];
  const materialsAnswers = [
    'We use recycled metals (e.g. sterling silver, gold-plated), upcycled crystals and beads, and other eco-friendly materials. Product pages list specifics.',
    'Our jewelry uses recycled and upcycled materials: sterling silver, gold-plated options, natural and recycled beads. Each product page has full material details.',
    'We prioritise recycled metals, upcycled beads and crystals, and sustainable alternatives. All materials are sourced responsibly. Check product pages for each piece.',
  ];
  materialsPhrasings.forEach((q, i) => addPair(pairs, seen, 'materials', q, materialsAnswers[i % materialsAnswers.length]));

  // Care
  carePairs.forEach(({ q, a }) => addPair(pairs, seen, 'care', q, a));
  const carePhrasings = [
    'Care?', 'Jewelry care?', 'How to care?', 'Cleaning?', 'Clean?', 'Store?', 'Storage?', 'Tarnish?', 'Maintain?',
    'Waterproof?', 'Shower?', 'Swim?', 'Polish?', 'Wear in shower?', 'Care instructions?', 'Looking after?',
    'Take care of jewelry?', 'Maintenance?', 'Cleaning tips?', 'How to clean?', 'How to store?', 'Prevent tarnish?',
    'Silver care?', 'Gold plated care?', 'Bracelet care?', 'Ring care?', 'Necklace care?', 'Earring care?',
    'Keep jewelry safe?', 'Jewelry storage?', 'Avoid damage?', 'Long lasting?', 'Durability?',
  ];
  const careAnswers = [
    'Care varies by piece. Generally: avoid water and chemicals, store in a dry place, clean with a soft cloth. Specific instructions come with each order.',
    'We recommend removing jewelry before showering or swimming, storing in a jewelry box or pouch, and wiping with a soft cloth after wear. Details come with each purchase.',
    'Avoid prolonged moisture and chemicals, apply perfume before putting on jewelry, and store pieces separately. Product-specific care is included with your order.',
  ];
  carePhrasings.forEach((q, i) => addPair(pairs, seen, 'care', q, careAnswers[i % careAnswers.length]));

  // Product: type-based "Do you have X?"
  productPairs.forEach(({ q, a }) => addPair(pairs, seen, 'product', q, a));
  const productAnswer = 'We have a range of jewelry in that category. Browse the shop or filter by category. If you don\'t see what you want, contact us—we may have it or can suggest alternatives.';
  const productQuestionTemplates = [
    (t) => `Do you have ${t}?`, (t) => `Do you sell ${t}?`, (t) => `${t}?`, (t) => `Looking for ${t}`, (t) => `I want ${t}`,
    (t) => `Any ${t}?`, (t) => `Do you have any ${t}?`, (t) => `Got ${t}?`, (t) => `Have ${t}?`, (t) => `Need ${t}`,
    (t) => `I need ${t}`, (t) => `Searching for ${t}`, (t) => `Interested in ${t}`, (t) => `Want to buy ${t}`,
    (t) => `Show me ${t}`, (t) => `Can I get ${t}?`, (t) => `Do you offer ${t}?`, (t) => `${t} available?`,
    (t) => `Looking to buy ${t}`, (t) => `Where are your ${t}?`, (t) => `Tell me about your ${t}`,
  ];
  productTypes.forEach((type) => {
    productQuestionTemplates.forEach((tpl) => addPair(pairs, seen, 'product', tpl(type), productAnswer));
  });

  // Contact
  contactPairs.forEach(({ q, a }) => addPair(pairs, seen, 'contact', q, a));
  const contactPhrasings = [
    'Contact?', 'Contact you?', 'Reach you?', 'Get in touch?', 'Talk to someone?', 'Help?', 'Support?', 'Customer service?',
    'Email?', 'Phone?', 'WhatsApp?', 'Number?', 'Address?', 'Hours?', 'Open?', 'When open?',
    'How to contact?', 'Contact info?', 'Contact details?', 'Support email?', 'Support number?', 'Customer support?',
    'Reach support?', 'Call you?', 'Message you?', 'Business hours?', 'Opening hours?', 'Working hours?',
    'When are you available?', 'Reply time?', 'Response time?', 'Get help?', 'Need to talk?', 'Inquiry?',
    'Send message?', 'Contact form?', 'Live chat?', 'Talk to support?', 'Human support?', 'Real person?',
  ];
  const contactAnswers = [
    'Reach us on WhatsApp +94 774442642, email plusarch.lk@gmail.com, or the website inquiry form. Business hours: Mon–Fri 9AM–6PM, Sat 10AM–4PM.',
    'You can contact us via WhatsApp (+94 774442642), email (plusarch.lk@gmail.com), or the inquiry form. We reply during business hours.',
    'We\'re on WhatsApp at +94 774442642 and email at plusarch.lk@gmail.com. Mon–Fri 9AM–6PM, Sat 10AM–4PM.',
  ];
  contactPhrasings.forEach((q, i) => addPair(pairs, seen, 'contact', q, contactAnswers[i % contactAnswers.length]));

  // Payment
  paymentPairs.forEach(({ q, a }) => addPair(pairs, seen, 'payment', q, a));
  const paymentPhrasings = [
    'Payment?', 'Pay?', 'How to pay?', 'Payment method?', 'Payment methods?', 'Pay by bank transfer?', 'Bank transfer?',
    'Secure?', 'Safe to pay?', 'Price?', 'Total?', 'LKR?', 'Currency?',
    'Accepted payments?', 'Ways to pay?', 'Payment options?', 'Do you accept card?', 'Card payments?',
    'Pay later?', 'Installments?', 'Payment security?', 'Pay in LKR?',
    'Online payment?', 'Payment when?', 'When to pay?', 'Invoice?',
    'Receipt?', 'Payment proof?', 'How to send payment?',
  ];
  const paymentAnswers = [
    'Orders are confirmed in WhatsApp after you click “Buy” on the website. We\'ll share our bank account details and final total in LKR so you can pay by bank transfer.',
    'We mainly accept bank transfer within Sri Lanka. Once you confirm your items and delivery fee on WhatsApp, we\'ll send bank details and instructions for payment.',
    'We don\'t have an online card checkout. All payment details are shared safely in WhatsApp from our official number, and you pay by bank transfer in LKR.',
  ];
  paymentPhrasings.forEach((q, i) => addPair(pairs, seen, 'payment', q, paymentAnswers[i % paymentAnswers.length]));

  // Order status
  orderStatusPairs.forEach(({ q, a }) => addPair(pairs, seen, 'order_status', q, a));
  const orderPhrasings = [
    'Order?', 'My order?', 'Order status?', 'Status?', 'Tracking?', 'Shipped?', 'Dispatch?', 'When shipped?',
    'Where is it?', 'Delivery?', 'Arrival?', 'Confirmation?', 'Order update?', 'Order details?',
    'Track order?', 'Track package?', 'Where is my package?', 'When will it arrive?', 'Delivery status?',
    'Has it shipped?', 'Is it dispatched?', 'Order confirmation?', 'Did you get my order?', 'Order received?',
    'Update on order?', 'Order progress?', 'Delivery update?', 'Shipping update?', 'Lost order?', 'Missing order?',
    'Order delayed?', 'Late delivery?', 'Change address?', 'Update address?', 'Cancel order?', 'Modify order?',
  ];
  const orderAnswers = [
    'We confirm and update orders directly via WhatsApp or live chat. To check your status, just message us with your name and what you ordered and we\'ll look it up.',
    'There is no online tracking page. For any delivery questions, contact us on WhatsApp or live chat and we\'ll manually check your order with the courier.',
    'If your order feels late, send us your name and order details on WhatsApp or live chat. We\'ll contact the courier if needed and let you know the latest.',
  ];
  orderPhrasings.forEach((q, i) => addPair(pairs, seen, 'order_status', q, orderAnswers[i % orderAnswers.length]));

  // Lightweight paraphrased variants to expand the dataset by ~1000+ Q&A
  // This helps the AI see more natural phrasings without changing the core answers.
  const baseSnapshot = [...pairs];
  const variantSuffixes = [
    ' please',
    ' please?',
    ' for Plus Arch?',
    ' about Plus Arch?',
  ];

  baseSnapshot.forEach((pair, index) => {
    // Only expand roughly one third of the base pairs to avoid exploding the file too much
    if (!pair?.question || !pair?.answer) return;
    if (index % 3 !== 0) return;
    const suffix = variantSuffixes[index % variantSuffixes.length];
    const qVariant = `${pair.question.trim()}${suffix}`;
    addPair(pairs, seen, pair.intent || 'greeting', qVariant, pair.answer);
  });

  return pairs;
}

const pairs = generate();
const output = {
  description: 'Q&A dataset for Plus Arch Upcycle chatbot. Aligns with intents: greeting, shipping, returns, materials, care, product, contact, payment, order_status. Use to seed FAQs or for fine-tuning/RAG.',
  intents: INTENTS,
  pairs,
};

const outPath = path.join(__dirname, '..', 'data', 'ai-training', 'faq-dataset.json');
fs.writeFileSync(outPath, JSON.stringify(output, null, 2), 'utf8');
console.log('Wrote', pairs.length, 'pairs to', outPath);
