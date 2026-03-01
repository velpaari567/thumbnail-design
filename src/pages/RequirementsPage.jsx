import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getTemplateById } from '../data/templateData';
import './RequirementsPage.css';

const RequirementsPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const templateId = searchParams.get('template');
    const [template, setTemplate] = useState(null);
    const [photos, setPhotos] = useState({});
    const [photoPreviews, setPhotoPreviews] = useState({});
    const [texts, setTexts] = useState({});

    useEffect(() => {
        const loadTemplate = async () => {
            if (!templateId) {
                navigate('/templates');
                return;
            }
            const t = await getTemplateById(templateId);
            if (!t) {
                navigate('/templates');
                return;
            }
            setTemplate(t);

            // Initialize text fields
            const initialTexts = {};
            t.requirements.texts.forEach(tf => {
                initialTexts[tf.id] = '';
            });
            setTexts(initialTexts);
        };
        loadTemplate();
    }, [templateId, navigate]);

    const handlePhotoChange = (photoId, file) => {
        if (file) {
            // Check file size (3MB limit)
            const MAX_SIZE_MB = 3;
            if (file.size > MAX_SIZE_MB * 1024 * 1024) {
                alert(`The image is too large! Please select an image under ${MAX_SIZE_MB}MB.`);
                return;
            }

            setPhotos(prev => ({ ...prev, [photoId]: file }));
            const reader = new FileReader();
            reader.onload = (e) => {
                setPhotoPreviews(prev => ({ ...prev, [photoId]: e.target.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleTextChange = (textId, value) => {
        setTexts(prev => ({ ...prev, [textId]: value }));
    };

    const isFormValid = () => {
        if (!template) return false;

        // Check required photos
        const requiredPhotos = template.requirements.photos.filter(p => p.required);
        for (const photo of requiredPhotos) {
            if (!photos[photo.id]) return false;
        }

        // Check required texts
        const requiredTexts = template.requirements.texts.filter(t => t.required);
        for (const text of requiredTexts) {
            if (!texts[text.id] || texts[text.id].trim() === '') return false;
        }

        return true;
    };

    const handleNext = () => {
        if (isFormValid()) {
            // Build photo data array with labels and base64
            const photoData = template.requirements.photos
                .filter(p => photoPreviews[p.id])
                .map(p => ({
                    id: p.id,
                    label: p.label,
                    dataUrl: photoPreviews[p.id]
                }));

            // Save form data to sessionStorage for the payment page
            sessionStorage.setItem('thumbnail_order', JSON.stringify({
                templateId,
                templateName: template.name,
                templateIcon: template.icon,
                templatePreviewColor: template.previewColor,
                baseCost: template.baseCost,
                texts,
                photos: photoData,
                photoCount: Object.keys(photos).length
            }));
            navigate(`/timing?template=${templateId}`);
        }
    };

    if (!template) return null;

    return (
        <div className="requirements-page page">
            <div className="container">
                <div className="req-header animate-fade-in">
                    <button className="btn btn-secondary" onClick={() => navigate(`/templates`)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="15,18 9,12 15,6" />
                        </svg>
                        Back
                    </button>
                    <div>
                        <h1 className="req-title">Add Your Content</h1>
                        <p className="req-subtitle">
                            Template: <strong>{template.name}</strong> {template.icon}
                        </p>
                    </div>
                    {/* Before/After Thumbnail Preview */}
                    {(template.thumbnailUrl || template.actualThumbnailUrl) && (
                        <div className="preview-container">
                            {template.thumbnailUrl && (
                                <div
                                    className="preview-image"
                                    style={{ backgroundImage: `url(${template.thumbnailUrl})` }}
                                    title="Template Preview"
                                />
                            )}
                            {template.actualThumbnailUrl && (
                                <div
                                    className={`preview-image ${template.thumbnailUrl ? 'preview-fader' : ''}`}
                                    style={{ backgroundImage: `url(${template.actualThumbnailUrl})` }}
                                    title="Actual Final Result"
                                />
                            )}
                            {template.thumbnailUrl && template.actualThumbnailUrl && (
                                <div style={{
                                    position: 'absolute',
                                    bottom: '4px',
                                    right: '4px',
                                    background: 'rgba(0,0,0,0.6)',
                                    padding: '2px 6px',
                                    borderRadius: '10px',
                                    fontSize: '10px',
                                    color: 'white',
                                    fontWeight: 'bold',
                                    pointerEvents: 'none',
                                    zIndex: 10
                                }}>
                                    Before & After View
                                </div>
                            )}
                        </div>
                    )}
                    <div className="templates-step-badge" style={{ marginLeft: 'auto' }}>Step 2 of 4</div>
                </div>

                <div className="req-content">
                    {/* Photo Uploads */}
                    {template.requirements.photos.length > 0 && (
                        <div className="req-section animate-fade-in-up stagger-1">
                            <h2 className="req-section-title">
                                📸 Photos
                                <span className="req-section-count">
                                    {Object.keys(photos).length} / {template.requirements.photos.length}
                                </span>
                            </h2>
                            <div className="req-photos-grid">
                                {template.requirements.photos.map((photo) => (
                                    <div key={photo.id} className="req-photo-upload glass-card">
                                        <label htmlFor={`photo-${photo.id}`} className="req-photo-label">
                                            {photoPreviews[photo.id] ? (
                                                <div className="req-photo-preview">
                                                    <img src={photoPreviews[photo.id]} alt={photo.label} />
                                                    <div className="req-photo-overlay">
                                                        <span>Change Photo</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="req-photo-placeholder">
                                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                        <rect x="3" y="3" width="18" height="18" rx="2" />
                                                        <circle cx="8.5" cy="8.5" r="1.5" />
                                                        <path d="M21 15l-5-5L5 21" />
                                                    </svg>
                                                    <span>Upload Photo</span>
                                                </div>
                                            )}
                                        </label>
                                        <input
                                            type="file"
                                            id={`photo-${photo.id}`}
                                            accept="image/*"
                                            onChange={(e) => handlePhotoChange(photo.id, e.target.files[0])}
                                            style={{ display: 'none' }}
                                        />
                                        <div className="req-photo-info">
                                            <span className="req-photo-name">{photo.label}</span>
                                            {photo.required && <span className="req-required">Required</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Text Fields */}
                    {template.requirements.texts.length > 0 && (
                        <div className="req-section animate-fade-in-up stagger-2">
                            <h2 className="req-section-title">✏️ Text Content</h2>
                            <div className="req-texts-grid">
                                {template.requirements.texts.map((textField) => (
                                    <div key={textField.id} className="req-text-field">
                                        <label className="req-text-label">
                                            {textField.label}
                                            {textField.required && <span className="req-required">Required</span>}
                                        </label>
                                        <input
                                            type="text"
                                            placeholder={textField.placeholder}
                                            value={texts[textField.id] || ''}
                                            onChange={(e) => handleTextChange(textField.id, e.target.value)}
                                            id={`text-${textField.id}`}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="templates-footer animate-fade-in">
                    <button
                        className="btn btn-primary btn-large"
                        disabled={!isFormValid()}
                        onClick={handleNext}
                        id="requirements-next-btn"
                    >
                        Next Step
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="9,18 15,12 9,6" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RequirementsPage;
