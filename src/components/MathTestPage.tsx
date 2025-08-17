import React from 'react';
import { ContentRenderer } from './ContentRenderer';

export const MathTestPage: React.FC = () => {
  const testContent = [
    {
      title: "Simple Math Test",
      content: `This is a simple test to verify math rendering:

**Inline math**: $x = 5$ and $y = 10$

**Block math**: $$E = mc^2$$

**Complex inline**: $\\vec{x}_t = [c_{t-1}, f_{t-1}, c_t]$

**Complex block**: $$p(\\vec{x}) = \\prod_{t=1}^{T} p(x_t \\mid x_1, \\dots, x_{t-1})$$

**Bold math test**: $\\mathbf{u}_t$ and $\\mathbf{R}_u$

**Simple test**: $c_t$ and $u_t$`
    },
    {
      title: "WaveNet Example (Markdown + Math)",
      content: `**WaveNet** is an audio generative model based on the [PixelCNN](https://paperswithcode.com/method/pixelcnn) architecture. In order to deal with long-range temporal dependencies needed for raw audio generation, architectures are developed based on dilated causal convolutions, which exhibit very large receptive fields.

The joint probability of a waveform $\\vec{x} = \\{ x_1, \\dots, x_T \\}$ is factorised as a product of conditional probabilities as follows:

$$p\\left(\\vec{x}\\right) = \\prod_{t=1}^{T} p\\left(x_t \\mid x_1, \\dots ,x_{t-1}\\right)$$

Each audio sample $x_t$ is therefore conditioned on the samples at all previous timesteps.`
    },
    {
      title: "WaveRNN Example",
      content: `**WaveRNN** is a single-layer recurrent neural network for audio generation that is designed efficiently predict 16-bit raw audio samples. The overall computation in the WaveRNN is as follows (biases omitted for brevity): $$ \\mathbf{x}_{t} = \\left[\\mathbf{c}_{t−1},\\mathbf{f}_{t−1}, \\mathbf{c}_{t}\\right] $$ $$ \\mathbf{u}_{t} = \\sigma\\left(\\mathbf{R}_{u}\\mathbf{h}_{t-1} + \\mathbf{I}^{*}_{u}\\mathbf{x}_{t}\\right) $$ $$ \\mathbf{r}_{t} = \\sigma\\left(\\mathbf{R}_{r}\\mathbf{h}_{t-1} + \\mathbf{I}^{*}_{r}\\mathbf{x}_{t}\\right) $$ $$ \\mathbf{e}_{t} = \\tau\\left(\\mathbf{r}_{t} \\odot \\left(\\mathbf{R}_{e}\\mathbf{h}_{t-1}\\right) + \\mathbf{I}^{*}_{e}\\mathbf{x}_{t} \\right) $$ $$ \\mathbf{h}_{t} = \\mathbf{u}_{t} \\cdot \\mathbf{h}_{t-1} + \\left(1-\\mathbf{u}_{t}\\right) \\cdot \\mathbf{e}_{t} $$ $$ \\mathbf{y}_{c}, \\mathbf{y}_{f} = \\text{split}\\left(\\mathbf{h}_{t}\\right) $$ $$ P\\left(\\mathbf{c}_{t}\\right) = \\text{softmax}\\left(\\mathbf{O}_{2}\\text{relu}\\left(\\mathbf{O}_{1}\\mathbf{y}_{c}\\right)\\right) $$ $$ P\\left(\\mathbf{f}_{t}\\right) = \\text{softmax}\\left(\\mathbf{O}_{4}\\text{relu}\\left(\\mathbf{O}_{3}\\mathbf{y}_{f}\\right)\\right) $$ where the $*$ indicates a masked matrix whereby the last coarse input $\\mathbf{c}_{t}$ is only connected to the fine part of the states $\\mathbf{u}_{t}$, $\\mathbf{r}_{t}$, $\\mathbf{e}_{t}$ and $\\mathbf{h}_{t}$ and thus only affects the fine output $\\mathbf{y}_{f}$. The coarse and fine parts $\\mathbf{c}_{t}$ and $\\mathbf{f}_{t}$ are encoded as scalars in $\\left[0, 255\\right]$ and scaled to the interval $\\left[−1, 1\\right]$. The matrix $\\mathbf{R}$ formed from the matrices $\\mathbf{R}_{u}$, $\\mathbf{R}_{r}$, $\\mathbf{R}_{e}$ is computed as a single matrix-vector product to produce the contributions to all three gates $\\mathbf{u}_{t}$, $\\mathbf{r}_{t}$ and $\\mathbf{e}_{t}$ (a variant of the [GRU cell](https://paperswithcode.com/method/gru). $\\sigma$ and $\\tau$ are the standard sigmoid and tanh non-linearities. Each part feeds into a [softmax](https://paperswithcode.com/method/softmax) layer over the corresponding 8 bits and the prediction of the 8 fine bits is conditioned on the 8 coarse bits. The resulting Dual Softmax layer allows for efficient prediction of 16-bit samples using two small output spaces (2 8 values each) instead of a single large output space (with 2 16 values).`
    },
    {
      title: "ConvLSTM Example",
      content: `**ConvLSTM** is a type of recurrent neural network for spatio-temporal prediction that has convolutional structures in both the input-to-state and state-to-state transitions. The ConvLSTM determines the future state of a certain cell in the grid by the inputs and past states of its local neighbors. This can easily be achieved by using a [convolution](https://paperswithcode.com/method/convolution) operator in the state-to-state and input-to-state transitions (see Figure). The key equations of ConvLSTM are shown below, where $*$ denotes the convolution operator and $\\odot$ the Hadamard product: $$ i_{t} = \\sigma\\left(W_{xi} * X_{t} + W_{hi} * H_{t−1} + W_{ci} \\odot \\mathcal{C}_{t−1} + b_{i}\\right) $$ $$ f_{t} = \\sigma\\left(W_{xf} * X_{t} + W_{hf} * H_{t−1} + W_{cf} \\odot \\mathcal{C}_{t−1} + b_{f}\\right) $$ $$ \\mathcal{C}_{t} = f_{t} \\odot \\mathcal{C}_{t−1} + i_{t} \\odot \\text{tanh}\\left(W_{xc} * X_{t} + W_{hc} * \\mathcal{H}_{t−1} + b_{c}\\right) $$ $$ o_{t} = \\sigma\\left(W_{xo} * X_{t} + W_{ho} * \\mathcal{H}_{t−1} + W_{co} \\odot \\mathcal{C}_{t} + b_{o}\\right) $$ $$ \\mathcal{H}_{t} = o_{t} \\odot \\text{tanh}\\left(C_{t}\\right) $$ If we view the states as the hidden representations of moving objects, a ConvLSTM with a larger transitional kernel should be able to capture faster motions while one with a smaller kernel can capture slower motions. To ensure that the states have the same number of rows and same number of columns as the inputs, padding is needed before applying the convolution operation. Here, padding of the hidden states on the boundary points can be viewed as using the state of the outside world for calculation. Usually, before the first input comes, we initialize all the states of the [LSTM](https://paperswithcode.com/method/lstm) to zero which corresponds to "total ignorance" of the future.`
    },
    {
      title: "WaveGAN Example (Markdown + Math)",
      content: `**WaveGAN** is a generative adversarial network for unsupervised synthesis of raw-waveform audio (as opposed to image-like spectrograms). The WaveGAN architecture is based off [DCGAN](https://paperswithcode.com/method/dcgan). The DCGAN generator uses the [transposed convolution](https://paperswithcode.com/method/transposed-convolution) operation to iteratively upsample low-resolution feature maps into a high-resolution image. WaveGAN modifies this transposed [convolution](https://paperswithcode.com/method/convolution) operation to widen its receptive field, using a longer one-dimensional filters of length 25 instead of two-dimensional filters of size 5x5, and upsampling by a factor of 4 instead of 2 at each layer. The discriminator is modified in a similar way, using length-25 filters in one dimension and increasing stride from 2 to 4. These changes result in WaveGAN having the same number of parameters, numerical operations, and output dimensionality as DCGAN. An additional layer is added afterwards to allow for more audio samples. Further changes include:

1. **Flattening 2D convolutions into 1D** (e.g. 5x5 2D conv becomes length-25 1D).
2. **Increasing the stride factor** for all convolutions (e.g. stride 2x2 becomes stride 4).
3. **Removing [batch normalization](https://paperswithcode.com/method/batch-normalization)** from the generator and discriminator.
4. **Training using the [WGAN](https://paperswithcode.com/method/wgan)-GP strategy**.

The mathematical formulation can be expressed as:

$$ G: \\mathbb{R}^d \\rightarrow \\mathbb{R}^{4^n \\times 1} $$

Where $G$ is the generator, $d$ is the latent dimension, and $4^n$ represents the upsampling factor at each of the $n$ layers.`
    },
    {
      title: "Simple Math Examples",
      content: `Here are some simple mathematical expressions:

**Inline math**: The quadratic formula is $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$

**Block math**: The area of a circle is $$A = \\pi r^2$$

**Complex equation**: $$\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}$$

**Matrix notation**: $$\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}$$

**Summation**: $$\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}$$`
    },
    {
      title: "Minimal Math Test",
      content: `Testing minimal math expressions:

**Simple**: $x$

**With subscript**: $x_t$

**With bold**: $\\mathbf{x}_t$

**Complex**: $\\mathbf{R}_u \\mathbf{h}_{t-1}$

**Very simple**: $c_t$`
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Enhanced Content Rendering Test</h1>
      
      <div className="space-y-8">
        {testContent.map((item, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">{item.title}</h2>
            <div className="prose prose-sm max-w-none">
              <ContentRenderer content={item.content} />
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-lg font-medium text-blue-900 mb-2">Features Supported:</h3>
        <ul className="text-blue-800 space-y-1">
          <li>• **Bold text** and *italic text*</li>
          <li>• [Links](https://example.com) with proper styling</li>
          <li>• Inline math: $x^2 + y^2 = z^2$</li>
          <li>• Block math: $$\\int f(x) dx$$</li>
          <li>• Numbered and bulleted lists</li>
          <li>• Code blocks and inline code</li>
          <li>• Headings and blockquotes</li>
          <li>• Tables and other Markdown features</li>
        </ul>
      </div>
    </div>
  );
}; 