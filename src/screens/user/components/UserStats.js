// UserStats.jsx
import React, { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import logo from "../../recources/images/apex-logo.png";

const pillStyle = {
  padding: '8px 15px 8px 15px',
  borderRadius: '20px',
  border: "1px solid rgba(255, 255, 255, 0.2)",
  outlineOffset: '-0.5px',
  display: 'flex',
  alignItems: 'center',
  gap: '5px',
  fontFamily: 'Inter, sans-serif',
  fontSize: '10px',
  fontWeight: 500,
  color: 'white',
  justifyItems: 'center'

};

const UserStats = ({ uid }) => {
  const [stats, setStats] = useState({ apexPoints: 0, gsCurrency: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const userRef = doc(db, 'users', uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          setStats({
            apexPoints: data.apexPoints || 0,
            gsCurrency: data.gsCurrency || 0,
          });
        }
      } catch (err) {
        console.error('Ошибка загрузки статусов пользователя:', err);
      } finally {
        setLoading(false);
      }
    };

    if (uid) fetchStats();
  }, [uid]);

  if (loading) return null;

  return (
    <div style={{ display: 'flex', gap: '8px', }}>
      <div style={pillStyle}>
        <span>{stats.apexPoints.toLocaleString()}</span>
        <div style={{ width: '16px', height: '16px' }}>
          {/* можно заменить на свой SVG или компонент */}
          <div
          >
            <img src={logo} alt='logo'></img>

          </div>
        </div>
      </div>

      {/* GS‑валюта */}
      <div style={pillStyle}>
        <span>{stats.gsCurrency.toLocaleString()}</span>
        <div style={{ width: '16px', height: '16px' }}>
          {/* можно заменить на свой SVG или компонент */}
          <div
          >
            <svg width="16" height="15" viewBox="0 0 11 10" fill="none" xmlns="http://www.w3.org/2000/svg">
<g clip-path="url(#paint0_diamond_4291_10_clip_path)" data-figma-skip-parse="true"><g transform="matrix(0 0.005 -0.005 0 5.88672 5)"><rect x="0" y="0" width="1200" height="1200" fill="url(#paint0_diamond_4291_10)" opacity="1" shape-rendering="crispEdges"/><rect x="0" y="0" width="1200" height="1200" transform="scale(1 -1)" fill="url(#paint0_diamond_4291_10)" opacity="1" shape-rendering="crispEdges"/><rect x="0" y="0" width="1200" height="1200" transform="scale(-1 1)" fill="url(#paint0_diamond_4291_10)" opacity="1" shape-rendering="crispEdges"/><rect x="0" y="0" width="1200" height="1200" transform="scale(-1)" fill="url(#paint0_diamond_4291_10)" opacity="1" shape-rendering="crispEdges"/></g></g><path d="M6.5426 0.271674C6.18037 -0.0905575 5.59307 -0.0905585 5.23084 0.271674L3.4156 2.08692L5.88672 4.55804L8.35784 2.08692L6.5426 0.271674Z" data-figma-gradient-fill="{&#34;type&#34;:&#34;GRADIENT_DIAMOND&#34;,&#34;stops&#34;:[{&#34;color&#34;:{&#34;r&#34;:0.0,&#34;g&#34;:1.0,&#34;b&#34;:0.83333331346511841,&#34;a&#34;:1.0},&#34;position&#34;:0.0},{&#34;color&#34;:{&#34;r&#34;:0.0,&#34;g&#34;:0.51666665077209473,&#34;b&#34;:1.0,&#34;a&#34;:1.0},&#34;position&#34;:1.0}],&#34;stopsVar&#34;:[{&#34;color&#34;:{&#34;r&#34;:0.0,&#34;g&#34;:1.0,&#34;b&#34;:0.83333331346511841,&#34;a&#34;:1.0},&#34;position&#34;:0.0},{&#34;color&#34;:{&#34;r&#34;:0.0,&#34;g&#34;:0.51666665077209473,&#34;b&#34;:1.0,&#34;a&#34;:1.0},&#34;position&#34;:1.0}],&#34;transform&#34;:{&#34;m00&#34;:6.1232350570192273e-16,&#34;m01&#34;:-10.000000953674316,&#34;m02&#34;:10.886719703674316,&#34;m10&#34;:10.000000953674316,&#34;m11&#34;:6.1232350570192273e-16,&#34;m12&#34;:-6.1232350570192273e-16},&#34;opacity&#34;:1.0,&#34;blendMode&#34;:&#34;NORMAL&#34;,&#34;visible&#34;:true}"/>
<g clip-path="url(#paint1_diamond_4291_10_clip_path)" data-figma-skip-parse="true"><g transform="matrix(0 0.005 -0.005 0 5.88672 5)"><rect x="0" y="0" width="1200" height="1200" fill="url(#paint1_diamond_4291_10)" opacity="1" shape-rendering="crispEdges"/><rect x="0" y="0" width="1200" height="1200" transform="scale(1 -1)" fill="url(#paint1_diamond_4291_10)" opacity="1" shape-rendering="crispEdges"/><rect x="0" y="0" width="1200" height="1200" transform="scale(-1 1)" fill="url(#paint1_diamond_4291_10)" opacity="1" shape-rendering="crispEdges"/><rect x="0" y="0" width="1200" height="1200" transform="scale(-1)" fill="url(#paint1_diamond_4291_10)" opacity="1" shape-rendering="crispEdges"/></g></g><path d="M8.79978 2.52886L6.32866 4.99998L8.7998 7.47112L10.615 5.65588C10.9773 5.29365 10.9773 4.70635 10.615 4.34412L8.79978 2.52886Z" data-figma-gradient-fill="{&#34;type&#34;:&#34;GRADIENT_DIAMOND&#34;,&#34;stops&#34;:[{&#34;color&#34;:{&#34;r&#34;:0.0,&#34;g&#34;:1.0,&#34;b&#34;:0.83333331346511841,&#34;a&#34;:1.0},&#34;position&#34;:0.0},{&#34;color&#34;:{&#34;r&#34;:0.0,&#34;g&#34;:0.51666665077209473,&#34;b&#34;:1.0,&#34;a&#34;:1.0},&#34;position&#34;:1.0}],&#34;stopsVar&#34;:[{&#34;color&#34;:{&#34;r&#34;:0.0,&#34;g&#34;:1.0,&#34;b&#34;:0.83333331346511841,&#34;a&#34;:1.0},&#34;position&#34;:0.0},{&#34;color&#34;:{&#34;r&#34;:0.0,&#34;g&#34;:0.51666665077209473,&#34;b&#34;:1.0,&#34;a&#34;:1.0},&#34;position&#34;:1.0}],&#34;transform&#34;:{&#34;m00&#34;:6.1232350570192273e-16,&#34;m01&#34;:-10.000000953674316,&#34;m02&#34;:10.886719703674316,&#34;m10&#34;:10.000000953674316,&#34;m11&#34;:6.1232350570192273e-16,&#34;m12&#34;:-6.1232350570192273e-16},&#34;opacity&#34;:1.0,&#34;blendMode&#34;:&#34;NORMAL&#34;,&#34;visible&#34;:true}"/>
<g clip-path="url(#paint2_diamond_4291_10_clip_path)" data-figma-skip-parse="true"><g transform="matrix(0 0.005 -0.005 0 5.88672 5)"><rect x="0" y="0" width="1200" height="1200" fill="url(#paint2_diamond_4291_10)" opacity="1" shape-rendering="crispEdges"/><rect x="0" y="0" width="1200" height="1200" transform="scale(1 -1)" fill="url(#paint2_diamond_4291_10)" opacity="1" shape-rendering="crispEdges"/><rect x="0" y="0" width="1200" height="1200" transform="scale(-1 1)" fill="url(#paint2_diamond_4291_10)" opacity="1" shape-rendering="crispEdges"/><rect x="0" y="0" width="1200" height="1200" transform="scale(-1)" fill="url(#paint2_diamond_4291_10)" opacity="1" shape-rendering="crispEdges"/></g></g><path d="M8.35786 7.91306L5.88672 5.44192L3.41558 7.91306L5.23084 9.72833C5.59307 10.0906 6.18037 10.0906 6.5426 9.72833L8.35786 7.91306Z" data-figma-gradient-fill="{&#34;type&#34;:&#34;GRADIENT_DIAMOND&#34;,&#34;stops&#34;:[{&#34;color&#34;:{&#34;r&#34;:0.0,&#34;g&#34;:1.0,&#34;b&#34;:0.83333331346511841,&#34;a&#34;:1.0},&#34;position&#34;:0.0},{&#34;color&#34;:{&#34;r&#34;:0.0,&#34;g&#34;:0.51666665077209473,&#34;b&#34;:1.0,&#34;a&#34;:1.0},&#34;position&#34;:1.0}],&#34;stopsVar&#34;:[{&#34;color&#34;:{&#34;r&#34;:0.0,&#34;g&#34;:1.0,&#34;b&#34;:0.83333331346511841,&#34;a&#34;:1.0},&#34;position&#34;:0.0},{&#34;color&#34;:{&#34;r&#34;:0.0,&#34;g&#34;:0.51666665077209473,&#34;b&#34;:1.0,&#34;a&#34;:1.0},&#34;position&#34;:1.0}],&#34;transform&#34;:{&#34;m00&#34;:6.1232350570192273e-16,&#34;m01&#34;:-10.000000953674316,&#34;m02&#34;:10.886719703674316,&#34;m10&#34;:10.000000953674316,&#34;m11&#34;:6.1232350570192273e-16,&#34;m12&#34;:-6.1232350570192273e-16},&#34;opacity&#34;:1.0,&#34;blendMode&#34;:&#34;NORMAL&#34;,&#34;visible&#34;:true}"/>
<g clip-path="url(#paint3_diamond_4291_10_clip_path)" data-figma-skip-parse="true"><g transform="matrix(0 0.005 -0.005 0 5.88672 5)"><rect x="0" y="0" width="1200" height="1200" fill="url(#paint3_diamond_4291_10)" opacity="1" shape-rendering="crispEdges"/><rect x="0" y="0" width="1200" height="1200" transform="scale(1 -1)" fill="url(#paint3_diamond_4291_10)" opacity="1" shape-rendering="crispEdges"/><rect x="0" y="0" width="1200" height="1200" transform="scale(-1 1)" fill="url(#paint3_diamond_4291_10)" opacity="1" shape-rendering="crispEdges"/><rect x="0" y="0" width="1200" height="1200" transform="scale(-1)" fill="url(#paint3_diamond_4291_10)" opacity="1" shape-rendering="crispEdges"/></g></g><path d="M2.97364 7.47112L5.44478 4.99998L2.97365 2.52886L1.15839 4.34412C0.796161 4.70635 0.79616 5.29365 1.15839 5.65588L2.97364 7.47112Z" data-figma-gradient-fill="{&#34;type&#34;:&#34;GRADIENT_DIAMOND&#34;,&#34;stops&#34;:[{&#34;color&#34;:{&#34;r&#34;:0.0,&#34;g&#34;:1.0,&#34;b&#34;:0.83333331346511841,&#34;a&#34;:1.0},&#34;position&#34;:0.0},{&#34;color&#34;:{&#34;r&#34;:0.0,&#34;g&#34;:0.51666665077209473,&#34;b&#34;:1.0,&#34;a&#34;:1.0},&#34;position&#34;:1.0}],&#34;stopsVar&#34;:[{&#34;color&#34;:{&#34;r&#34;:0.0,&#34;g&#34;:1.0,&#34;b&#34;:0.83333331346511841,&#34;a&#34;:1.0},&#34;position&#34;:0.0},{&#34;color&#34;:{&#34;r&#34;:0.0,&#34;g&#34;:0.51666665077209473,&#34;b&#34;:1.0,&#34;a&#34;:1.0},&#34;position&#34;:1.0}],&#34;transform&#34;:{&#34;m00&#34;:6.1232350570192273e-16,&#34;m01&#34;:-10.000000953674316,&#34;m02&#34;:10.886719703674316,&#34;m10&#34;:10.000000953674316,&#34;m11&#34;:6.1232350570192273e-16,&#34;m12&#34;:-6.1232350570192273e-16},&#34;opacity&#34;:1.0,&#34;blendMode&#34;:&#34;NORMAL&#34;,&#34;visible&#34;:true}"/>
<defs>
<clipPath id="paint0_diamond_4291_10_clip_path"><path d="M6.5426 0.271674C6.18037 -0.0905575 5.59307 -0.0905585 5.23084 0.271674L3.4156 2.08692L5.88672 4.55804L8.35784 2.08692L6.5426 0.271674Z"/></clipPath><clipPath id="paint1_diamond_4291_10_clip_path"><path d="M8.79978 2.52886L6.32866 4.99998L8.7998 7.47112L10.615 5.65588C10.9773 5.29365 10.9773 4.70635 10.615 4.34412L8.79978 2.52886Z"/></clipPath><clipPath id="paint2_diamond_4291_10_clip_path"><path d="M8.35786 7.91306L5.88672 5.44192L3.41558 7.91306L5.23084 9.72833C5.59307 10.0906 6.18037 10.0906 6.5426 9.72833L8.35786 7.91306Z"/></clipPath><clipPath id="paint3_diamond_4291_10_clip_path"><path d="M2.97364 7.47112L5.44478 4.99998L2.97365 2.52886L1.15839 4.34412C0.796161 4.70635 0.79616 5.29365 1.15839 5.65588L2.97364 7.47112Z"/></clipPath><linearGradient id="paint0_diamond_4291_10" x1="0" y1="0" x2="500" y2="500" gradientUnits="userSpaceOnUse">
<stop stop-color="#00FFD5"/>
<stop offset="1" stop-color="#0084FF"/>
</linearGradient>
<linearGradient id="paint1_diamond_4291_10" x1="0" y1="0" x2="500" y2="500" gradientUnits="userSpaceOnUse">
<stop stop-color="#00FFD5"/>
<stop offset="1" stop-color="#0084FF"/>
</linearGradient>
<linearGradient id="paint2_diamond_4291_10" x1="0" y1="0" x2="500" y2="500" gradientUnits="userSpaceOnUse">
<stop stop-color="#00FFD5"/>
<stop offset="1" stop-color="#0084FF"/>
</linearGradient>
<linearGradient id="paint3_diamond_4291_10" x1="0" y1="0" x2="500" y2="500" gradientUnits="userSpaceOnUse">
<stop stop-color="#00FFD5"/>
<stop offset="1" stop-color="#0084FF"/>
</linearGradient>
</defs>
</svg>

          </div>
        </div>
      </div>
    </div>
    
  );
};

export default UserStats;
