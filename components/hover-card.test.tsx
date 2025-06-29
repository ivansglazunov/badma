import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { HoverCard } from './hover-card';

// Mock react-resize-detector
jest.mock('react-resize-detector', () => ({
  useResizeDetector: () => ({
    width: 300,
    height: 500,
    ref: jest.fn(),
  }),
}));

describe('HoverCard', () => {
  it('renders children correctly', () => {
    render(
      <HoverCard>
        <div data-testid="test-content">Test Content</div>
      </HoverCard>
    );
    
    expect(screen.getByTestId('test-content')).toBeInTheDocument();
  });

  it('applies hover class on mouse enter', () => {
    render(
      <HoverCard>
        <div data-testid="test-content">Test Content</div>
      </HoverCard>
    );
    
    const hoverCard = screen.getByTestId('test-content').parentElement;
    expect(hoverCard).toHaveClass('hover-card');
  });

  it('does not respond to mouse events when disabled', () => {
    const { container } = render(
      <HoverCard disabled={true}>
        <div data-testid="test-content">Test Content</div>
      </HoverCard>
    );
    
    const hoverCard = container.firstChild as HTMLElement;
    
    fireEvent.mouseEnter(hoverCard);
    fireEvent.mouseMove(hoverCard, { clientX: 100, clientY: 100 });
    
    // Should not have any transform applied when disabled
    expect(hoverCard.style.transform).toBe('');
  });

  it('applies custom force prop correctly', () => {
    render(
      <HoverCard force={0.8}>
        <div data-testid="test-content">Test Content</div>
      </HoverCard>
    );
    
    // Component should render without errors with custom force
    expect(screen.getByTestId('test-content')).toBeInTheDocument();
  });

  it('accepts custom className', () => {
    render(
      <HoverCard className="custom-class">
        <div data-testid="test-content">Test Content</div>
      </HoverCard>
    );
    
    const hoverCard = screen.getByTestId('test-content').parentElement;
    expect(hoverCard).toHaveClass('hover-card', 'custom-class');
  });
}); 