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
  'Colombo', 'Kandy', 'Galle', 'Jaffna', 'Negombo', 'Anuradhapura', 'Trincomalee', 'Batticaloa', 'Matara', 'Ratnapura',
  'Kurunegala', 'Badulla', 'Gampaha', 'Kalutara', 'Hambantota', 'Vavuniya', 'Kilinochchi', 'Mannar', 'Mullaitivu', 'Ampara',
  'Polonnaruwa', 'Monaragala', 'Kegalle', 'Puttalam', 'Sri Lanka', 'the UK', 'the USA', 'USA', 'UK', 'Australia',
  'Canada', 'India', 'UAE', 'Dubai', 'Singapore', 'Malaysia', 'Germany', 'France', 'Japan', 'New Zealand',
  'Middle East', 'Europe', 'Asia', 'North America', 'my country', 'overseas', 'abroad', 'internationally',
];

const shippingPairs = [
  { q: 'How long does shipping take?', a: 'Shipping typically takes 3–7 business days within Sri Lanka. International shipping may take 2–4 weeks depending on the destination. We use eco-friendly packaging and carbon-neutral shipping options where possible.' },
  { q: 'Do you ship internationally?', a: 'Yes, we ship internationally. Delivery usually takes 2–4 weeks depending on your country. Customs and duties are the responsibility of the recipient.' },
  { q: 'How much is delivery?', a: 'Delivery costs depend on your location and order size. Shipping within Sri Lanka is calculated at checkout. For international orders, we\'ll provide a quote. We use sustainable packaging.' },
  { q: 'Can I track my order?', a: 'Yes. Once your order is dispatched, we\'ll send you tracking details by email so you can follow your package.' },
  { q: 'When will my order be dispatched?', a: 'Orders are usually dispatched within 1–2 business days. You\'ll receive an email with tracking once it\'s shipped.' },
  { q: 'Do you offer free shipping?', a: 'Shipping terms depend on your order and location. Check the cart or checkout page for current shipping options and any free-shipping thresholds.' },
  { q: 'What courier do you use?', a: 'We use reliable courier partners for local and international delivery. You\'ll get tracking details once your order is dispatched.' },
  { q: 'How is my order packaged?', a: 'We use eco-friendly packaging. Jewelry is packed securely to avoid damage during transit.' },
  { q: 'How fast can I get my order?', a: 'Within Sri Lanka expect 3–7 business days. International orders typically 2–4 weeks. Dispatch is usually within 1–2 business days.' },
  { q: 'Is shipping carbon neutral?', a: 'We use carbon-neutral or eco-friendly shipping options where available. Our packaging is also chosen with sustainability in mind.' },
  { q: 'Can I get express delivery?', a: 'Delivery speed depends on your location. Contact us via WhatsApp or at checkout to ask about faster options for your area.' },
  { q: 'Where do you ship from?', a: 'We ship from Sri Lanka. Local orders take 3–7 business days; international orders 2–4 weeks depending on destination.' },
  { q: 'My package hasn\'t arrived', a: 'Check your email for tracking info. If it\'s past the expected window, contact us with your order number and we\'ll look into it.' },
  { q: 'Delivery time?', a: '3–7 business days within Sri Lanka; 2–4 weeks internationally. You\'ll get tracking once dispatched.' },
  { q: 'Shipping time?', a: 'Local: 3–7 business days. International: 2–4 weeks. Dispatch usually within 1–2 business days.' },
  { q: 'How long for delivery?', a: 'Sri Lanka: 3–7 business days. International: 2–4 weeks depending on destination.' },
  { q: 'When do you ship?', a: 'We dispatch within 1–2 business days. You\'ll receive tracking by email.' },
  { q: 'Do you deliver to my address?', a: 'We deliver across Sri Lanka and internationally. Enter your address at checkout to see options and cost.' },
  { q: 'Shipping cost to my city?', a: 'Shipping is calculated at checkout based on your location. Add items to cart and proceed to checkout to see the cost.' },
  { q: 'Eco packaging?', a: 'Yes. We use eco-friendly packaging and sustainable options where possible.' },
  { q: 'Can I get my order tomorrow?', a: 'Delivery times are 3–7 days locally and 2–4 weeks internationally. Contact us to ask about express options.' },
  { q: 'How many days for shipping?', a: 'Within Sri Lanka: 3–7 business days. International: 2–4 weeks.' },
  { q: 'Tracking number?', a: 'We send tracking details by email once your order is dispatched. Check your inbox and spam folder.' },
  { q: 'Where is my package?', a: 'Use the tracking link we sent by email. If you didn\'t get it, contact us with your order number.' },
  { q: 'Dispatch time?', a: 'Orders are typically dispatched within 1–2 business days.' },
  { q: 'International delivery?', a: 'Yes. We ship internationally. Delivery usually takes 2–4 weeks. Customs and duties may apply.' },
  { q: 'Local delivery?', a: 'Yes. We deliver across Sri Lanka in 3–7 business days.' },
  { q: 'Shipping options?', a: 'Options and costs are shown at checkout based on your location. We use eco-friendly packaging.' },
  { q: 'Free delivery?', a: 'Check the cart or checkout for current shipping offers and any free-shipping threshold.' },
  { q: 'Delivery charge?', a: 'Delivery cost depends on location and order. It\'s shown at checkout.' },
  { q: 'How much is shipping?', a: 'Shipping is calculated at checkout. It depends on your location and order size.' },
  { q: 'Do you ship worldwide?', a: 'Yes. We ship internationally. Delivery typically takes 2–4 weeks depending on destination.' },
  { q: 'Shipping to Sri Lanka?', a: 'Yes. We ship across Sri Lanka. Delivery usually takes 3–7 business days.' },
  { q: 'Can you ship today?', a: 'We dispatch within 1–2 business days. Contact us for urgent orders.' },
  { q: 'When will it arrive?', a: 'Local: 3–7 business days after dispatch. International: 2–4 weeks. Check your tracking email.' },
  { q: 'How do I get tracking?', a: 'We email tracking details once your order is shipped. Check your inbox and spam.' },
  { q: 'Package lost?', a: 'Contact us with your order number and we\'ll check with the courier and help resolve it.' },
  { q: 'Delayed delivery?', a: 'Check your tracking email for updates. If it\'s significantly late, contact us with your order number.' },
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
  { q: 'What payment methods do you accept?', a: 'We accept common payment methods at checkout, including cards and local options. Exact methods are shown when you place an order. All transactions are secure.' },
  { q: 'Can I pay on delivery?', a: 'Payment options depend on your region. Check the checkout page for available methods. For Sri Lanka, we may offer cash on delivery where applicable.' },
  { q: 'Do you accept card payments?', a: 'Yes. Card and other payment options are available at checkout. The exact methods are shown when you place your order.' },
  { q: 'Is checkout secure?', a: 'Yes. We use secure payment processing. Your card details are handled by our payment provider, not stored on our site.' },
  { q: 'Can I pay in instalments?', a: 'Instalment options depend on the payment methods we offer at checkout. Check the checkout page or contact us to see what\'s available for your order.' },
  { q: 'Do you accept PayPal?', a: 'Payment methods are listed at checkout. If PayPal isn\'t shown, contact us—we may be able to accommodate alternative arrangements for your region.' },
  { q: 'Payment in LKR?', a: 'Yes. Prices are in LKR for Sri Lanka. Checkout will show the total and accepted payment methods in local currency.' },
  { q: 'Cash on delivery?', a: 'For Sri Lanka, we may offer cash on delivery where applicable. Check checkout for available options.' },
  { q: 'Credit card?', a: 'Yes. Credit and debit cards are typically accepted at checkout. See the checkout page for the full list.' },
  { q: 'Debit card?', a: 'Yes. Debit cards are typically accepted. Check the checkout page for your region.' },
  { q: 'Bank transfer?', a: 'Payment methods are shown at checkout. If bank transfer is available, it will be listed there.' },
  { q: 'Secure payment?', a: 'Yes. We use secure payment processing. Your card or payment details are not stored on our servers.' },
  { q: 'Payment options?', a: 'Options are displayed at checkout and may include cards, COD (where available), and other local methods.' },
  { q: 'Pay in USD?', a: 'Our prices are in LKR. If you\'re overseas, your card or payment provider may convert. Check checkout for your currency.' },
  { q: 'Payment when?', a: 'Payment is taken at checkout when you place your order. For COD, you pay on delivery.' },
  { q: 'Visa Mastercard?', a: 'We typically accept major cards including Visa and Mastercard. Check the checkout page for your order.' },
  { q: 'Payment failed?', a: 'Check your card details and try again. If it keeps failing, try another method or contact us with your order details.' },
  { q: 'Invoice?', a: 'Order confirmation and details are sent by email. For a formal invoice, contact us after ordering.' },
  { q: 'Receipt?', a: 'Order confirmation is sent by email and serves as your receipt. For a formal receipt or invoice, contact us.' },
  { q: 'Refund to card?', a: 'Refunds are processed to the original payment method. Card refunds may take a few business days to appear.' },
];

// ---- Order status ----
const orderStatusPairs = [
  { q: 'Where is my order?', a: 'Once your order is shipped, we send tracking details by email. If you haven\'t received them or have concerns, contact us via WhatsApp or email with your order number.' },
  { q: 'How do I check my order status?', a: 'We\'ll email you when your order is confirmed and when it\'s dispatched. For more details, contact us with your order number and we\'ll look it up.' },
  { q: 'Has my order shipped?', a: 'You\'ll receive an email with tracking when it ships. If you haven\'t had an update, contact us with your order number and we\'ll check.' },
  { q: 'When will I get my order?', a: 'Local orders usually arrive in 3–7 business days after dispatch; international 2–4 weeks. Check your email for tracking once it\'s shipped.' },
  { q: 'I didn\'t get tracking', a: 'Check spam and promotions folders. If you still don\'t see it, contact us with your order number and we\'ll resend or look up the status.' },
  { q: 'Order not received', a: 'First check your tracking email. If the delivery window has passed, contact us with your order number and we\'ll investigate with the courier.' },
  { q: 'Can you resend my order confirmation?', a: 'Contact us with the email you used to order and we\'ll resend the confirmation and any tracking we have.' },
  { q: 'Order status?', a: 'We email you when the order is confirmed and when it\'s dispatched. For details, contact us with your order number.' },
  { q: 'Tracking info?', a: 'Tracking is sent by email when your order ships. Check spam. If missing, contact us with your order number.' },
  { q: 'When was my order shipped?', a: 'You\'ll have received an email when it shipped. For the exact date, contact us with your order number.' },
  { q: 'Order delayed?', a: 'Check your tracking for updates. If it\'s significantly late, contact us with your order number and we\'ll follow up with the courier.' },
  { q: 'Change delivery address?', a: 'Contact us immediately with your order number and new address. We can only change it if the order hasn\'t shipped yet.' },
  { q: 'Reschedule delivery?', a: 'Contact us or the courier (using the tracking link) to see if rescheduling is possible.' },
  { q: 'Order confirmation?', a: 'You should receive an email confirmation after placing your order. If not, check spam or contact us with your email and order details.' },
  { q: 'Lost order?', a: 'Contact us with your order number. We\'ll check tracking and work with the courier to resolve it.' },
  { q: 'Wrong address on order?', a: 'Contact us right away with your order number. If it hasn\'t shipped we may be able to correct it.' },
  { q: 'Order number?', a: 'Your order number is in the confirmation email we sent when you placed the order. Check your inbox and spam.' },
  { q: 'How to track?', a: 'Use the tracking link in the dispatch email we sent you. If you don\'t have it, contact us with your order number.' },
  { q: 'Delivery status?', a: 'Check the tracking link in your shipping email. For help, contact us with your order number.' },
  { q: 'Update on my order?', a: 'We\'ll email you when the order is confirmed and when it\'s shipped. For a specific update, contact us with your order number.' },
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
    (c) => 'Yes, we ship to ' + c + '. Within Sri Lanka delivery is typically 3–7 business days; internationally 2–4 weeks depending on destination. Cost is shown at checkout.',
    (c) => 'Yes. We ship to ' + c + '. Local Sri Lanka orders: 3–7 business days. International: 2–4 weeks. See checkout for shipping cost.',
    (c) => 'Delivery to ' + c + ' is typically 3–7 business days within Sri Lanka, or 2–4 weeks if international. You\'ll get tracking once shipped.',
    (c) => 'Yes. We deliver to ' + c + '. Times and cost are shown at checkout.',
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
    'Payment?', 'Pay?', 'How to pay?', 'Payment method?', 'Payment methods?', 'Pay by card?', 'Card?', 'Cash?', 'COD?',
    'Secure?', 'Safe to pay?', 'Checkout?', 'Price?', 'Total?', 'LKR?', 'Currency?',
    'Accepted payments?', 'Ways to pay?', 'Payment options?', 'Credit card?', 'Debit card?', 'Cash on delivery?',
    'Pay later?', 'Installments?', 'Payment security?', 'Secure checkout?', 'Pay in LKR?', 'USD?', 'PayPal?',
    'Bank transfer?', 'Online payment?', 'Payment when?', 'When to pay?', 'Payment at checkout?', 'Invoice?',
    'Receipt?', 'Payment proof?', 'Refund method?', 'How refund?',
  ];
  const paymentAnswers = [
    'We accept cards and other methods shown at checkout. All payments are secure. For Sri Lanka, prices are in LKR; COD may be available.',
    'Payment options are displayed at checkout and may include cards, COD where available, and other local methods. All transactions are secure.',
    'Yes. We use secure payment processing. Prices are in LKR for Sri Lanka. Exact payment methods appear when you place an order.',
  ];
  paymentPhrasings.forEach((q, i) => addPair(pairs, seen, 'payment', q, paymentAnswers[i % paymentAnswers.length]));

  // Order status
  orderStatusPairs.forEach(({ q, a }) => addPair(pairs, seen, 'order_status', q, a));
  const orderPhrasings = [
    'Order?', 'My order?', 'Order status?', 'Status?', 'Tracking?', 'Shipped?', 'Dispatch?', 'When shipped?',
    'Where is it?', 'Delivery?', 'Arrival?', 'Confirmation?', 'Order number?', 'Order update?', 'Order details?',
    'Track order?', 'Track package?', 'Where is my package?', 'When will it arrive?', 'Delivery status?',
    'Has it shipped?', 'Is it dispatched?', 'Order confirmation?', 'Did you get my order?', 'Order received?',
    'Update on order?', 'Order progress?', 'Delivery update?', 'Shipping update?', 'Lost order?', 'Missing order?',
    'Order delayed?', 'Late delivery?', 'Change address?', 'Update address?', 'Cancel order?', 'Modify order?',
  ];
  const orderAnswers = [
    'We email you when your order is confirmed and when it\'s shipped (with tracking). For the latest status, contact us with your order number.',
    'Check your email for the tracking link once your order has shipped. If you need help, contact us with your order number.',
    'Order confirmations and shipping updates are sent by email. For a status check, contact us with your order number and we\'ll look it up.',
  ];
  orderPhrasings.forEach((q, i) => addPair(pairs, seen, 'order_status', q, orderAnswers[i % orderAnswers.length]));

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
