import React from 'react';
import classnames from 'classnames';
import color from 'color';

import { Popover } from '@lla-ui/floating';
import { SketchPicker } from 'react-color';

import { useColorValue, ColorContextInfo } from './theme';

const ColorInput: React.FC<{
  value: readonly [number, number, number];
  onChange: React.Dispatch<
    React.SetStateAction<readonly [number, number, number]>
  >;
}> = ({ value, onChange }) => {
  const c = React.useMemo(() => color.rgb(value).hex(), [value]);
  return (
    <Popover.PopoverContext placement="top" enableClick>
      <Popover.PopoverHandler>
        <div
          className="rvt-color-input__trigger"
          style={{
            background: c,
          }}
        ></div>
      </Popover.PopoverHandler>
      <Popover.PopoverContent showArrow className="rvt-color-input">
        <SketchPicker
          color={c}
          onChangeComplete={(v) => {
            onChange([v.rgb.r, v.rgb.g, v.rgb.b]);
          }}
        ></SketchPicker>
      </Popover.PopoverContent>
    </Popover.PopoverContext>
  );
};

const AccentColorLine: React.FC<{
  category: 'primary' | 'secondary' | 'tertiary';
}> = ({ category }) => {
  const themeColor = useColorValue();
  const [rawColor, setRawColor] = ColorContextInfo.useLens([category]);
  const className = classnames(
    'rvt-color-editor__line flex',
    category === 'primary' && 'rvt-color-editor__line--primary',
    category === 'secondary' && 'rvt-color-editor__line--secondary',
    category === 'tertiary' && 'rvt-color-editor__line--tertiary',
  );
  return (
    <div className={className}>
      <div className="rvt-color-editor__line__raw">
        <div className="category">{category}</div>
        <ColorInput value={rawColor} onChange={setRawColor}></ColorInput>
        <div className="arrow">
          <div className="arrow__body"></div>
          <div className="arrow__head"></div>
        </div>
      </div>
      <div className="blocks">
        <div className="block key">{renderHex('key')}</div>
        <div className="block on-key">{renderHex('on-key')}</div>
        <div className="block container">{renderHex('container')}</div>
        <div className="block on-container">{renderHex('on-container')}</div>
      </div>
    </div>
  );

  function renderHex(type: 'key' | 'on-key' | 'container' | 'on-container') {
    const name = [category, type].join('-');
    const hex = color.rgb(themeColor[category][type]).hex();
    return (
      <>
        <div>{name}</div>
        <div className="hex">{hex}</div>
      </>
    );
  }
};

const NeutralColorLine = () => {
  const category = 'neutral';
  const themeColor = useColorValue();
  const [rawColor, setRawColor] = ColorContextInfo.useLens([category]);
  const className = classnames(
    'rvt-color-editor__line flex',
    'rvt-color-editor__line--neutral',
  );
  return (
    <div className={className}>
      <div className="rvt-color-editor__line__raw">
        <div className="category">{category}</div>
        <ColorInput value={rawColor} onChange={setRawColor}></ColorInput>
        <div className="arrow">
          <div className="arrow__body"></div>
          <div className="arrow__head"></div>
        </div>
      </div>
      <div className="blocks">
        <div className="block background ">{renderHex('background')}</div>
        <div className="block on-background ">{renderHex('on-background')}</div>
        <div className="block surface ">{renderHex('surface')}</div>
        <div className="block on-surface ">{renderHex('on-surface')}</div>
      </div>
    </div>
  );

  function renderHex(
    type: 'background' | 'on-background' | 'surface' | 'on-surface',
  ) {
    const name = [category, type].join('-');
    const hex = color.rgb(themeColor[category][type]).hex();
    return (
      <>
        <div>{name}</div>
        <div className="hex">{hex}</div>
      </>
    );
  }
};

const NeutralVariantColorLine = () => {
  const category = 'neutral-variant';
  const themeColor = useColorValue();
  const [rawColor, setRawColor] = ColorContextInfo.useLens([category]);
  const className = classnames(
    'rvt-color-editor__line flex',
    'rvt-color-editor__line--neutral-variant',
  );
  return (
    <div className={className}>
      <div className="rvt-color-editor__line__raw">
        <div className="category">{category}</div>
        <ColorInput value={rawColor} onChange={setRawColor}></ColorInput>
        <div className="arrow">
          <div className="arrow__body"></div>
          <div className="arrow__head"></div>
        </div>
      </div>
      <div className="blocks">
        <div className="block surface">{renderHex('surface')}</div>
        <div className="block on-surface">{renderHex('on-surface')}</div>
        <div className="block outlines">{renderHex('outline')}</div>
      </div>
    </div>
  );

  function renderHex(type: 'surface' | 'on-surface' | 'outline') {
    const name = [category, type].join('-');
    const hex = color.rgb(themeColor[category][type]).hex();
    return (
      <>
        <div>{name}</div>
        <div className="hex">{hex}</div>
      </>
    );
  }
};

export const ThemeEditor = () => {
  const [theme, setTheme] = ColorContextInfo.useLens(['theme']);
  return (
    <div className="w-screen h-screen bg-neutral-variant-surface text-neutral-variant-on-surface flex justify-center items-center">
      <div className="rvt-color-editor">
        {(['primary', 'secondary', 'tertiary'] as const).map((key) => (
          <AccentColorLine key={key} category={key}></AccentColorLine>
        ))}
        <NeutralColorLine></NeutralColorLine>
        <NeutralVariantColorLine></NeutralVariantColorLine>
      </div>
      <div
        className="fixed bottom-4 right-4 cursor-pointer"
        onClick={() => {
          setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
        }}
      >
        <div>{theme}</div>
      </div>
    </div>
  );
};
