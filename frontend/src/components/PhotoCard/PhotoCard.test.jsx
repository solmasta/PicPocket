import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import PhotoCard from './PhotoCard';
import { createMockPhoto } from '../../setupTests';

describe('PhotoCard Component', () => {
  const mockPhoto = createMockPhoto();
  const defaultProps = {
    photo: mockPhoto,
    viewMode: 'grid',
    onSelect: jest.fn(),
    onDelete: jest.fn(),
    onEdit: jest.fn(),
    onToggleFavorite: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    test('renders photo card with required props', () => {
      render(<PhotoCard {...defaultProps} />);
      
      expect(screen.getByRole('img')).toBeInTheDocument();
      expect(screen.getByText(mockPhoto.name)).toBeInTheDocument();
    });

    test('renders in grid view mode', () => {
      render(<PhotoCard {...defaultProps} viewMode="grid" />);
      
      const card = screen.getByTestId('photo-card');
      expect(card).toHaveClass('photo-card--grid');
    });

    test('renders in list view mode', () => {
      render(<PhotoCard {...defaultProps} viewMode="list" />);
      
      const card = screen.getByTestId('photo-card');
      expect(card).toHaveClass('photo-card--list');
    });

    test('displays photo caption when provided', () => {
      const photoWithCaption = createMockPhoto({ caption: 'Test caption' });
      render(<PhotoCard {...defaultProps} photo={photoWithCaption} />);
      
      expect(screen.getByText('Test caption')).toBeInTheDocument();
    });

    test('displays favorite indicator for favorite photos', () => {
      const favoritePhoto = createMockPhoto({ isFavorite: true });
      render(<PhotoCard {...defaultProps} photo={favoritePhoto} />);
      
      const favoriteButton = screen.getByLabelText('Remove from favorites');
      expect(favoriteButton).toBeInTheDocument();
    });

    test('displays tags when present', () => {
      const photoWithTags = createMockPhoto({ tags: ['nature', 'landscape'] });
      render(<PhotoCard {...defaultProps} photo={photoWithTags} />);
      
      expect(screen.getByText('nature')).toBeInTheDocument();
      expect(screen.getByText('landscape')).toBeInTheDocument();
    });

    test('shows loading state when isLoading is true', () => {
      render(<PhotoCard {...defaultProps} isLoading />);
      
      expect(screen.getByTestId('photo-card-skeleton')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    test('calls onSelect when photo is clicked', async () => {
      const user = userEvent.setup();
      render(<PhotoCard {...defaultProps} />);
      
      const photoElement = screen.getByRole('img');
      await user.click(photoElement);
      
      expect(defaultProps.onSelect).toHaveBeenCalledWith(mockPhoto);
    });

    test('calls onToggleFavorite when favorite button is clicked', async () => {
      const user = userEvent.setup();
      render(<PhotoCard {...defaultProps} />);
      
      const favoriteButton = screen.getByLabelText('Add to favorites');
      await user.click(favoriteButton);
      
      expect(defaultProps.onToggleFavorite).toHaveBeenCalledWith(mockPhoto.id);
    });

    test('calls onEdit when edit button is clicked', async () => {
      const user = userEvent.setup();
      render(<PhotoCard {...defaultProps} showActions />);
      
      const editButton = screen.getByLabelText('Edit photo');
      await user.click(editButton);
      
      expect(defaultProps.onEdit).toHaveBeenCalledWith(mockPhoto);
    });

    test('calls onDelete when delete button is clicked', async () => {
      const user = userEvent.setup();
      render(<PhotoCard {...defaultProps} showActions />);
      
      const deleteButton = screen.getByLabelText('Delete photo');
      await user.click(deleteButton);
      
      expect(defaultProps.onDelete).toHaveBeenCalledWith(mockPhoto.id);
    });

    test('calls onShare when share button is clicked', async () => {
      const user = userEvent.setup();
      const onShare = jest.fn();
      render(<PhotoCard {...defaultProps} onShare={onShare} showActions />);
      
      const shareButton = screen.getByLabelText('Share photo');
      await user.click(shareButton);
      
      expect(onShare).toHaveBeenCalledWith(mockPhoto);
    });
  });

  describe('Accessibility', () => {
    test('has proper ARIA attributes', () => {
      render(<PhotoCard {...defaultProps} />);
      
      const card = screen.getByTestId('photo-card');
      expect(card).toHaveAttribute('role', 'article');
      expect(card).toHaveAttribute('aria-label', expect.stringContaining('Photo'));
    });

    test('image has proper alt text', () => {
      render(<PhotoCard {...defaultProps} />);
      
      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('alt', expect.stringContaining('Test Photo'));
    });

    test('favorite button has proper ARIA pressed state', () => {
      render(<PhotoCard {...defaultProps} />);
      
      const favoriteButton = screen.getByLabelText('Add to favorites');
      expect(favoriteButton).toHaveAttribute('aria-pressed', 'false');
    });

    test('favorite button shows pressed state for favorite photos', () => {
      const favoritePhoto = createMockPhoto({ isFavorite: true });
      render(<PhotoCard {...defaultProps} photo={favoritePhoto} />);
      
      const favoriteButton = screen.getByLabelText('Remove from favorites');
      expect(favoriteButton).toHaveAttribute('aria-pressed', 'true');
    });

    test('action buttons are keyboard navigable', async () => {
      const user = userEvent.setup();
      render(<PhotoCard {...defaultProps} showActions />);
      
      const favoriteButton = screen.getByLabelText('Add to favorites');
      favoriteButton.focus();
      
      expect(favoriteButton).toHaveFocus();
      
      await user.keyboard('{Enter}');
      expect(defaultProps.onToggleFavorite).toHaveBeenCalled();
    });
  });

  describe('Keyboard Navigation', () => {
    test('handles Enter key on photo', async () => {
      const user = userEvent.setup();
      render(<PhotoCard {...defaultProps} />);
      
      const photoElement = screen.getByRole('img');
      photoElement.focus();
      
      await user.keyboard('{Enter}');
      expect(defaultProps.onSelect).toHaveBeenCalledWith(mockPhoto);
    });

    test('handles Space key on photo', async () => {
      const user = userEvent.setup();
      render(<PhotoCard {...defaultProps} />);
      
      const photoElement = screen.getByRole('img');
      photoElement.focus();
      
      await user.keyboard('{ }');
      expect(defaultProps.onSelect).toHaveBeenCalledWith(mockPhoto);
    });

    test('handles Escape key to close actions menu', async () => {
      const user = userEvent.setup();
      render(<PhotoCard {...defaultProps} showActions />);
      
      const menuButton = screen.getByLabelText('Photo actions');
      await user.click(menuButton);
      
      const card = screen.getByTestId('photo-card');
      await user.keyboard('{Escape}');
      
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('handles missing photo data gracefully', () => {
      const incompletePhoto = { id: 'test', name: 'Test' };
      render(<PhotoCard {...defaultProps} photo={incompletePhoto} />);
      
      expect(screen.getByText('Test')).toBeInTheDocument();
    });

    test('handles image load error', async () => {
      render(<PhotoCard {...defaultProps} />);
      
      const img = screen.getByRole('img');
      fireEvent.error(img);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to load image')).toBeInTheDocument();
      });
    });

    test('handles missing callbacks gracefully', () => {
      const propsWithoutCallbacks = {
        photo: mockPhoto,
        viewMode: 'grid',
        onSelect: null,
        onDelete: null,
        onEdit: null,
        onToggleFavorite: null
      };
      
      expect(() => {
        render(<PhotoCard {...propsWithoutCallbacks} />);
      }).not.toThrow();
    });
  });

  describe('Performance', () => {
    test('does not re-render unnecessarily', () => {
      const { rerender } = render(<PhotoCard {...defaultProps} />);
      
      rerender(<PhotoCard {...defaultProps} />);
      
      // Component should handle re-renders without issues
      expect(screen.getByTestId('photo-card')).toBeInTheDocument();
    });

    test('lazy loads large images', () => {
      render(<PhotoCard {...defaultProps} />);
      
      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('loading', 'lazy');
    });
  });

  describe('Responsive Behavior', () => {
    test('adapts to different screen sizes', () => {
      // Mock different viewport sizes
      Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 768 });
      render(<PhotoCard {...defaultProps} />);
      
      const card = screen.getByTestId('photo-card');
      expect(card).toBeInTheDocument();
      
      // Change to mobile
      Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 375 });
      render(<PhotoCard {...defaultProps} />);
      
      expect(card).toBeInTheDocument();
    });
  });
});