// Template data with default configurations
// Admin can override these settings from the admin panel

const defaultTemplates = [
  {
    id: 'template-1',
    name: 'Gaming Highlight',
    description: 'Perfect for gaming videos with action shots',
    previewColor: 'linear-gradient(135deg, #ff6b6b, #ee5a24)',
    icon: '🎮',
    requirements: {
      photos: [
        { id: 'main-photo', label: 'Main Character/Player Photo', required: true }
      ],
      texts: [
        { id: 'title', label: 'Video Title', placeholder: 'Enter your video title...', required: true },
        { id: 'subtitle', label: 'Subtitle/Tagline', placeholder: 'Enter a catchy tagline...', required: false }
      ]
    },
    baseCost: 10,
    offerCost: null // When set, shows as discounted price
  },
  {
    id: 'template-2',
    name: 'Tech Review',
    description: 'Clean layout for tech product reviews',
    previewColor: 'linear-gradient(135deg, #4facfe, #00f2fe)',
    icon: '📱',
    requirements: {
      photos: [
        { id: 'product-photo', label: 'Product Photo', required: true },
        { id: 'person-photo', label: 'Your Photo', required: true }
      ],
      texts: [
        { id: 'product-name', label: 'Product Name', placeholder: 'e.g., iPhone 16 Pro', required: true },
        { id: 'verdict', label: 'Review Verdict', placeholder: 'e.g., Best Phone of 2026?', required: false }
      ]
    },
    baseCost: 12,
    offerCost: null
  },
  {
    id: 'template-3',
    name: 'Vlog Style',
    description: 'Vibrant and personal vlog thumbnail',
    previewColor: 'linear-gradient(135deg, #f093fb, #f5576c)',
    icon: '🎬',
    requirements: {
      photos: [
        { id: 'selfie', label: 'Your Best Photo', required: true }
      ],
      texts: [
        { id: 'title', label: 'Vlog Title', placeholder: 'What\'s your vlog about?', required: true }
      ]
    },
    baseCost: 8,
    offerCost: null
  },
  {
    id: 'template-4',
    name: 'Tutorial/How-To',
    description: 'Educational content with step indicators',
    previewColor: 'linear-gradient(135deg, #43e97b, #38f9d7)',
    icon: '📚',
    requirements: {
      photos: [
        { id: 'demo-photo', label: 'Demo/Result Photo', required: true },
        { id: 'before-photo', label: 'Before Photo (Optional)', required: false }
      ],
      texts: [
        { id: 'title', label: 'Tutorial Title', placeholder: 'e.g., How to Edit Like a Pro', required: true },
        { id: 'steps', label: 'Number of Steps', placeholder: 'e.g., 5 Easy Steps', required: false },
        { id: 'tool', label: 'Tool/Software Used', placeholder: 'e.g., Photoshop, Premiere Pro', required: false }
      ]
    },
    baseCost: 10,
    offerCost: null // When set, shows as discounted price
  },
  {
    id: 'template-5',
    name: 'Podcast/Talk',
    description: 'Professional layout for podcast episodes',
    previewColor: 'linear-gradient(135deg, #fa709a, #fee140)',
    icon: '🎙️',
    requirements: {
      photos: [
        { id: 'host-photo', label: 'Host Photo', required: true },
        { id: 'guest-photo', label: 'Guest Photo', required: true },
        { id: 'logo', label: 'Show Logo (Optional)', required: false }
      ],
      texts: [
        { id: 'episode-title', label: 'Episode Title', placeholder: 'e.g., The Future of AI', required: true },
        { id: 'guest-name', label: 'Guest Name', placeholder: 'e.g., Elon Musk', required: true }
      ]
    },
    baseCost: 15,
    offerCost: null
  },
  {
    id: 'template-6',
    name: 'Reaction/Commentary',
    description: 'Eye-catching reaction video thumbnail',
    previewColor: 'linear-gradient(135deg, #a18cd1, #fbc2eb)',
    icon: '😱',
    requirements: {
      photos: [
        { id: 'reaction-face', label: 'Your Reaction Face', required: true },
        { id: 'content-screenshot', label: 'Content Screenshot', required: true }
      ],
      texts: [
        { id: 'title', label: 'Reaction Title', placeholder: 'e.g., I Can\'t Believe This!', required: true }
      ]
    },
    baseCost: 10,
    offerCost: null // When set, shows as discounted price
  }
];

export const getTemplates = () => {
  const adminConfig = localStorage.getItem('admin_templates');
  if (adminConfig) {
    try {
      return JSON.parse(adminConfig);
    } catch {
      return defaultTemplates;
    }
  }
  return defaultTemplates;
};

export const saveTemplates = (templates) => {
  localStorage.setItem('admin_templates', JSON.stringify(templates));
};

export const getTemplateById = (id) => {
  const templates = getTemplates();
  return templates.find(t => t.id === id);
};

export default defaultTemplates;
