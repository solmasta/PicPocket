import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PhotoItem from '../components/Gallery/PhotoItem';

const mockPhoto = {
  id: 'test-id',
  fileName: 'test-photo.jpg',
  fileType: 'image/jpeg',
  fileSize: 1024000,
  url: 'https://example.com/test.jpg',
  tags: ['horse', 'nature'],
  location: {
    latitude: 40.7128,
    longitude: -74.0060
  },
  uploadDate: '2024-01-15T10:30:00Z',
  syncedToServer: true
};

describe('PhotoItem', () => {
  it('should render photo information', () => {
    render(<PhotoItem photo={mockPhoto} onDelete={jest.fn()} onUpdateTags={jest.fn()} />);
    
    expect(screen.getByText('test-photo.jpg')).toBeInTheDocument();
    expect(screen.getByText('1.00 MB')).toBeInTheDocument();
  });

  it('should display tags correctly', () => {
    render(<PhotoItem photo={mockPhoto} onDelete={jest.fn()} onUpdateTags={jest.fn()} />);
    
    expect(screen.getByText('horse')).toBeInTheDocument();
    expect(screen.getByText('nature')).toBeInTheDocument();
  });

  it('should show location when available', () => {
    render(<PhotoItem photo={mockPhoto} onDelete={jest.fn()} onUpdateTags={jest.fn()} />);
    
    expect(screen.getByText(/40.7128/)).toBeInTheDocument();
    expect(screen.getByText(/-74.0060/)).toBeInTheDocument();
  });

  it('should call onDelete when delete button clicked', () => {
    const onDelete = jest.fn();
    window.confirm = jest.fn().mockReturnValue(true);
    
    render(<PhotoItem photo={mockPhoto} onDelete={onDelete} onUpdateTags={jest.fn()} />);
    
    fireEvent.click(screen.getByLabelText('Delete photo'));
    
    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this photo?');
    expect(onDelete).toHaveBeenCalledWith('test-id');
  });

  it('should not delete if user cancels confirmation', () => {
    const onDelete = jest.fn();
    window.confirm = jest.fn().mockReturnValue(false);
    
    render(<PhotoItem photo={mockPhoto} onDelete={onDelete} onUpdateTags={jest.fn()} />);
    
    fireEvent.click(screen.getByLabelText('Delete photo'));
    
    expect(onDelete).not.toHaveBeenCalled();
  });

  it('should toggle details visibility', () => {
    render(<PhotoItem photo={mockPhoto} onDelete={jest.fn()} onUpdateTags={jest.fn()} />);
    
    expect(screen.queryByText('ID:')).not.toBeInTheDocument();
    
    fireEvent.click(screen.getByText('Show Details'));
    
    expect(screen.getByText('ID:')).toBeInTheDocument();
    expect(screen.getByText('Type:')).toBeInTheDocument();
  });

  it('should show sync status when not synced', () => {
    const unsyncedPhoto = { ...mockPhoto, syncedToServer: false };
    render(<PhotoItem photo={unsyncedPhoto} onDelete={jest.fn()} onUpdateTags={jest.fn()} />);
    
    expect(screen.getByText('Not synced')).toBeInTheDocument();
  });

  it('should handle tag editing', () => {
    const onUpdateTags = jest.fn();
    render(<PhotoItem photo={mockPhoto} onDelete={jest.fn()} onUpdateTags={onUpdateTags} />);
    
    fireEvent.click(screen.getByLabelText('Edit tags'));
    
    const input = screen.getByLabelText('Edit tags');
    fireEvent.change(input, { target: { value: 'new, tags' } });
    
    fireEvent.click(screen.getByLabelText('Save tags'));
    
    expect(onUpdateTags).toHaveBeenCalledWith('test-id', ['new', 'tags']);
  });

  it('should cancel tag editing', () => {
    render(<PhotoItem photo={mockPhoto} onDelete={jest.fn()} onUpdateTags={jest.fn()} />);
    
    fireEvent.click(screen.getByLabelText('Edit tags'));
    
    const input = screen.getByLabelText('Edit tags');
    fireEvent.change(input, { target: { value: 'changed' } });
    
    fireEvent.click(screen.getByLabelText('Cancel editing tags'));
    
    expect(screen.getByText('horse')).toBeInTheDocument();
  });

  it('should handle image load error', () => {
    render(<PhotoItem photo={mockPhoto} onDelete={jest.fn()} onUpdateTags={jest.fn()} />);
    
    const img = screen.getByAltText('test-photo.jpg');
    fireEvent.error(img);
    
    expect(img.src).toContain('placehold.co');
  });

  it('should display horse theme for horse-related tags', () => {
    render(<PhotoItem photo={mockPhoto} onDelete={jest.fn()} onUpdateTags={jest.fn()} />);
    
    const photoItem = document.querySelector('.photo-item');
    expect(photoItem.classList.contains('horse-theme')).toBe(true);
  });
});