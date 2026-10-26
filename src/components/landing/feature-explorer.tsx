"use client";

import { useState } from "react";
import { Icon } from "@/components/landing/icons";
import { featureGroups } from "@/lib/landing-content";

export function FeatureExplorer() {
  const [activeId, setActiveId] = useState(featureGroups[0].id);
  const active = featureGroups.find((group) => group.id === activeId) ?? featureGroups[0];

  return (
    <div className="feature-explorer">
      <div className="feature-tabs" role="tablist" aria-label="Kelompok fitur Serahin">
        {featureGroups.map((group) => (
          <button key={group.id} type="button" role="tab" aria-selected={active.id === group.id} aria-controls={`feature-panel-${group.id}`} id={`feature-tab-${group.id}`} onClick={() => setActiveId(group.id)}>
            {group.label}
          </button>
        ))}
      </div>
      <div className="feature-panel" role="tabpanel" id={`feature-panel-${active.id}`} aria-labelledby={`feature-tab-${active.id}`} key={active.id}>
        <div className="feature-intro">
          <span className="eyebrow">{active.eyebrow}</span>
          <h3>{active.title}</h3>
          <p>{active.description}</p>
        </div>
        <div className="feature-grid">
          {active.features.map((feature) => (
            <article className="feature-card" key={feature.title}>
              <span className="icon-box"><Icon name={feature.icon}/></span>
              <h4>{feature.title}</h4>
              <p>{feature.description}</p>
              <span className="feature-detail">{feature.detail}</span>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
