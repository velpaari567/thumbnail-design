// Template data with Firestore persistence
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

const defaultTemplates = [
  {
    id: 'template-1',
    name: 'Gaming Highlight',
    description: 'Perfect for gaming videos with action shots',
    previewColor: 'linear-gradient(135deg, #ff6b35, #f7c948)',
    icon: '🎮',
    requirements: {
      photos: [
        { id: 'photo-1', label: 'Main Character/Player Photo', required: false }
      ],
      texts: [
        { id: 'text-1', label: 'Video Title', placeholder: 'Enter your video title...', required: false },
        { id: 'text-2', label: 'Subtitle/Tagline', placeholder: 'Enter a catchy tagline...', required: false }
      ]
    },
    baseCost: 10,
    offerCost: null
  },
  {
    id: 'template-2',
    name: 'Tech Review',
    description: 'Clean layout for tech product reviews',
    previewColor: 'linear-gradient(135deg, #00d2ff, #3a7bd5)',
    icon: '💻',
    requirements: {
      photos: [
        { id: 'photo-1', label: 'Product Photo', required: false },
        { id: 'photo-2', label: 'Background Image', required: false }
      ],
      texts: [
        { id: 'text-1', label: 'Product Name', placeholder: 'Enter product name...', required: false },
        { id: 'text-2', label: 'Review Verdict', placeholder: 'e.g. Must Buy, Worth It...', required: false }
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
        { id: 'photo-1', label: 'Your Photo', required: false }
      ],
      texts: [
        { id: 'text-1', label: 'Vlog Title', placeholder: 'What\'s the vlog about?', required: false }
      ]
    },
    baseCost: 8,
    offerCost: null
  },
  {
    id: 'template-4',
    name: 'Tutorial',
    description: 'Educational and clean tutorial style',
    previewColor: 'linear-gradient(135deg, #11998e, #38ef7d)',
    icon: '🎨',
    requirements: {
      photos: [
        { id: 'photo-1', label: 'Preview/Screenshot', required: false }
      ],
      texts: [
        { id: 'text-1', label: 'Tutorial Title', placeholder: 'What are you teaching?', required: false },
        { id: 'text-2', label: 'Step Count', placeholder: 'e.g. 5 Easy Steps', required: false }
      ]
    },
    baseCost: 10,
    offerCost: null
  },
  {
    id: 'template-5',
    name: 'Podcast',
    description: 'Professional podcast episode thumbnail',
    previewColor: 'linear-gradient(135deg, #f7971e, #ffd200)',
    icon: '🎙️',
    requirements: {
      photos: [
        { id: 'photo-1', label: 'Host Photo', required: false },
        { id: 'photo-2', label: 'Guest Photo', required: false }
      ],
      texts: [
        { id: 'text-1', label: 'Episode Title', placeholder: 'Episode topic...', required: false },
        { id: 'text-2', label: 'Guest Name', placeholder: 'Who is the guest?', required: false },
        { id: 'text-3', label: 'Episode Number', placeholder: 'EP #', required: false }
      ]
    },
    baseCost: 15,
    offerCost: null
  },
  {
    id: 'template-6',
    name: 'Reaction',
    description: 'Eye-catching reaction video thumbnail',
    previewColor: 'linear-gradient(135deg, #a855f7, #ec4899)',
    icon: '🤩',
    requirements: {
      photos: [
        { id: 'photo-1', label: 'Your Reaction Photo', required: false },
        { id: 'photo-2', label: 'What you\'re reacting to', required: false }
      ],
      texts: [
        { id: 'text-1', label: 'Reaction Title', placeholder: 'e.g. I Can\'t Believe This!', required: false }
      ]
    },
    baseCost: 10,
    offerCost: null
  }
];

const CONFIG_DOC_ID = 'templates';

export const getTemplates = async () => {
  try {
    const docRef = doc(db, 'config', CONFIG_DOC_ID);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists() && docSnap.data().items) {
      return docSnap.data().items;
    }

    // First run — save defaults to Firestore
    await setDoc(docRef, { items: defaultTemplates });
    return defaultTemplates;
  } catch (error) {
    console.error('Error getting templates:', error);
    return defaultTemplates;
  }
};

export const saveTemplates = async (templates) => {
  try {
    const docRef = doc(db, 'config', CONFIG_DOC_ID);
    await setDoc(docRef, { items: templates });
  } catch (error) {
    console.error('Error saving templates:', error);
  }
};

export const getTemplateById = async (templateId) => {
  const templates = await getTemplates();
  return templates.find(t => t.id === templateId) || null;
};
