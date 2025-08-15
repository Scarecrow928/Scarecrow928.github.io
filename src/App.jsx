import React from 'react';

function App() {
  const subpages = [
    { title: 'Subpage 1', url: '/subpage1' },
    { title: 'Subpage 2', url: '/subpage2' },
    { title: 'Subpage 3', url: '/subpage3' },
  ];

  return (
    <div>
      <h1>Main Page</h1>
      <ul>
        {subpages.map((page, index) => (
          <li key={index}>
            <a href={page.url}>{page.title}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
