import React from 'react';
import '../styles/Avatar.css';

const Avatar = ({ src, alt = 'Avatar', username = '', size = 'medium' }) => {
  const [imageError, setImageError] = React.useState(false);
  const initials = username ? username.charAt(0).toUpperCase() : 'U';

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div className={`avatar avatar-${size}`}>
      {src && !imageError ? (
        <img 
          src={src}
          alt={alt}
          onError={handleImageError}
        />
      ) : (
        <span className="avatar-placeholder">{initials}</span>
      )}
    </div>
  );
};

export default Avatar;
