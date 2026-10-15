import React from 'react';

/**
 * Shared section heading. Desktop: title on the left, lead text bottom-aligned on the right.
 * The accent phrase is set in serif italic with the logo gradient.
 */
export default function SectionHeader({ index, label, title, accent, children, align = 'left' }) {
  if (align === 'center') {
    return (
      <header className="mb-12 sm:mb-16 max-w-3xl mx-auto text-center">
        <div className="eyebrow justify-center">
          {index && <span className="idx">{index}</span>}
          <span className="rule" aria-hidden="true" />
          <span>{label}</span>
        </div>
        <h2 className="h2 mt-5">
          {title} {accent && <span className="serif">{accent}</span>}
        </h2>
        {children && <p className="lead mt-5 mx-auto">{children}</p>}
      </header>
    );
  }

  return (
    <header className="mb-12 sm:mb-16 grid lg:grid-cols-12 gap-6 lg:gap-10 items-end">
      <div className="lg:col-span-7">
        <div className="eyebrow">
          {index && <span className="idx">{index}</span>}
          <span className="rule" aria-hidden="true" />
          <span>{label}</span>
        </div>
        <h2 className="h2 mt-5">
          {title} {accent && <span className="serif">{accent}</span>}
        </h2>
      </div>
      {children && <p className="lead lg:col-span-5 lg:pb-2">{children}</p>}
    </header>
  );
}
