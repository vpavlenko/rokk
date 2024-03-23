import { useEffect } from 'react';

export default function App() {
  useEffect(() => {
    console.log('content view loaded');
    console.log('podbor: ', document.querySelectorAll('.podbor__chord')[0]);
    const chord = document.querySelectorAll('.podbor__chord')[0];
    chord.innerHTML = 'PWN';
    const transposeDown = document.querySelector('.btn[value="-1"]') as HTMLButtonElement;
    setTimeout(() => transposeDown.click(), 2000);
  }, []);

  return <div className="">content view</div>;
}
