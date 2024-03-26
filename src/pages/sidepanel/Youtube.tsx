import React from 'react';

interface Thumbnail {
  url: string;
  width: number;
  height: number;
}

interface Thumbnails {
  default: Thumbnail;
  medium: Thumbnail;
  high: Thumbnail;
}

interface Snippet {
  publishedAt: string;
  channelId: string;
  title: string;
  description: string;
  thumbnails: Thumbnails;
  channelTitle: string;
  liveBroadcastContent: string;
  publishTime: string;
}

export interface SearchResultItemProps {
  id: {
    kind: string;
    videoId: string;
  };
  snippet: Snippet;
}

const SearchResultItem: React.FC<{ result: SearchResultItemProps }> = ({ result }) => {
  const { snippet } = result;
  const { title, channelTitle, thumbnails } = snippet;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: '20px',
        border: '1px solid #ddd',
        padding: '10px',
        borderRadius: '5px',
      }}>
      <img
        src={thumbnails.high.url}
        alt={title}
        style={{ marginBottom: '10px', borderRadius: '4px', width: 50, height: 50 }}
      />
      <div style={{ fontWeight: 'bold', marginBottom: '5px', textAlign: 'center' }}>{title}</div>
      <div style={{ fontSize: '14px', color: '#666', textAlign: 'center' }}>{channelTitle}</div>
    </div>
  );
};

export default SearchResultItem;
