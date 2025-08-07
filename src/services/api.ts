import axios from 'axios';
import { Paper, CodeLink, EvaluationTable, Method, Dataset } from '../types';

// Papers with Code data URLs from README
const DATA_URLS = {
  papers: 'https://production-media.paperswithcode.com/about/papers-with-abstracts.json.gz',
  codeLinks: 'https://production-media.paperswithcode.com/about/links-between-papers-and-code.json.gz',
  evaluations: 'https://production-media.paperswithcode.com/about/evaluation-tables.json.gz',
  methods: 'https://production-media.paperswithcode.com/about/methods.json.gz',
  datasets: 'https://production-media.paperswithcode.com/about/datasets.json.gz'
};

class PapersWithCodeAPI {
  private cache = new Map<string, any>();
  private loadingPromises = new Map<string, Promise<any>>();

  private async fetchAndDecompress(url: string): Promise<any[]> {
    if (this.cache.has(url)) {
      return this.cache.get(url);
    }

    if (this.loadingPromises.has(url)) {
      return this.loadingPromises.get(url);
    }

    const promise = this.loadData(url);
    this.loadingPromises.set(url, promise);
    
    try {
      const data = await promise;
      this.cache.set(url, data);
      this.loadingPromises.delete(url);
      return data;
    } catch (error) {
      this.loadingPromises.delete(url);
      throw error;
    }
  }

  private async loadData(url: string): Promise<any[]> {
    try {
      // Since the actual URLs return gzipped data that can't be directly fetched in browser,
      // we'll use mock data for now. In a production app, you'd need a backend service
      // to handle the gzip decompression or use uncompressed endpoints.
      console.warn(`Using mock data for ${url} - gzipped data not directly accessible in browser`);
      return this.getMockData(url);
    } catch (error) {
      console.warn(`Failed to load data from ${url}, using mock data`);
      return this.getMockData(url);
    }
  }

  private getMockData(url: string): any[] {
    // Mock data for development/demo purposes
    if (url.includes('papers-with-abstracts')) {
      return [
        {
          id: '1',
          title: 'Attention Is All You Need',
          abstract: 'The dominant sequence transduction models are based on complex recurrent or convolutional neural networks in an encoder-decoder configuration. The best performing models also connect the encoder and decoder through an attention mechanism. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely.',
          authors: ['Ashish Vaswani', 'Noam Shazeer', 'Niki Parmar', 'Jakob Uszkoreit', 'Llion Jones', 'Aidan N. Gomez', 'Łukasz Kaiser', 'Illia Polosukhin'],
          published: '2017-06-12',
          arxiv_id: '1706.03762',
          conference: 'NIPS 2017'
        },
        {
          id: '2',
          title: 'BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding',
          abstract: 'We introduce a new language representation model called BERT, which stands for Bidirectional Encoder Representations from Transformers. Unlike recent language representation models, BERT is designed to pre-train deep bidirectional representations from unlabeled text by jointly conditioning on both left and right context in all layers.',
          authors: ['Jacob Devlin', 'Ming-Wei Chang', 'Kenton Lee', 'Kristina Toutanova'],
          published: '2018-10-11',
          arxiv_id: '1810.04805',
          conference: 'NAACL 2019'
        },
        {
          id: '3',
          title: 'ResNet: Deep Residual Learning for Image Recognition',
          abstract: 'Deeper neural networks are more difficult to train. We present a residual learning framework to ease the training of networks that are substantially deeper than those used previously. We explicitly reformulate the layers as learning residual functions with reference to the layer inputs, instead of learning unreferenced functions.',
          authors: ['Kaiming He', 'Xiangyu Zhang', 'Shaoqing Ren', 'Jian Sun'],
          published: '2015-12-10',
          arxiv_id: '1512.03385',
          conference: 'CVPR 2016'
        },
        {
          id: '4',
          title: 'Generative Adversarial Networks',
          abstract: 'We propose a new framework for estimating generative models via an adversarial process, in which we simultaneously train two models: a generative model G that captures the data distribution, and a discriminative model D that estimates the probability that a sample came from the training data rather than G.',
          authors: ['Ian J. Goodfellow', 'Jean Pouget-Abadie', 'Mehdi Mirza', 'Bing Xu', 'David Warde-Farley', 'Sherjil Ozair', 'Aaron Courville', 'Yoshua Bengio'],
          published: '2014-06-10',
          arxiv_id: '1406.2661',
          conference: 'NIPS 2014'
        },
        {
          id: '5',
          title: 'YOLO: You Only Look Once: Unified, Real-Time Object Detection',
          abstract: 'We present YOLO, a new approach to object detection. Prior work on object detection repurposes classifiers to perform detection. Instead, we frame object detection as a regression problem to spatially separated bounding boxes and associated class probabilities.',
          authors: ['Joseph Redmon', 'Santosh Divvala', 'Ross Girshick', 'Ali Farhadi'],
          published: '2015-06-08',
          arxiv_id: '1506.02640',
          conference: 'CVPR 2016'
        }
      ];
    }
    
    if (url.includes('links-between-papers-and-code')) {
      return [
        {
          paper_title: 'Attention Is All You Need',
          repo_url: 'https://github.com/tensorflow/tensor2tensor',
          is_official: true,
          framework: 'TensorFlow'
        },
        {
          paper_title: 'BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding',
          repo_url: 'https://github.com/google-research/bert',
          is_official: true,
          framework: 'TensorFlow'
        },
        {
          paper_title: 'ResNet: Deep Residual Learning for Image Recognition',
          repo_url: 'https://github.com/KaimingHe/deep-residual-networks',
          is_official: true,
          framework: 'Caffe'
        },
        {
          paper_title: 'YOLO: You Only Look Once: Unified, Real-Time Object Detection',
          repo_url: 'https://github.com/pjreddie/darknet',
          is_official: true,
          framework: 'C'
        }
      ];
    }

    if (url.includes('evaluation-tables')) {
      return [
        {
          id: '1',
          paper: 'ResNet-50',
          dataset: 'ImageNet',
          task: 'Image Classification',
          metrics: { 'Top-1 Accuracy': 76.2, 'Top-5 Accuracy': 93.3 },
          model_name: 'ResNet-50',
          paper_title: 'ResNet: Deep Residual Learning for Image Recognition',
          paper_url: 'https://arxiv.org/abs/1512.03385'
        },
        {
          id: '2',
          paper: 'EfficientNet-B0',
          dataset: 'ImageNet',
          task: 'Image Classification',
          metrics: { 'Top-1 Accuracy': 77.1, 'Top-5 Accuracy': 93.3 },
          model_name: 'EfficientNet-B0',
          paper_title: 'EfficientNet: Rethinking Model Scaling for Convolutional Neural Networks',
          paper_url: 'https://arxiv.org/abs/1905.11946'
        },
        {
          id: '3',
          paper: 'YOLOv5',
          dataset: 'COCO',
          task: 'Object Detection',
          metrics: { 'mAP@0.5': 0.456, 'mAP@0.5:0.95': 0.367 },
          model_name: 'YOLOv5',
          paper_title: 'YOLOv5: An Improved Version of YOLO',
          paper_url: 'https://github.com/ultralytics/yolov5'
        }
      ];
    }

    if (url.includes('datasets')) {
      return [
        {
          name: 'ImageNet',
          full_name: 'ImageNet Large Scale Visual Recognition Challenge',
          description: 'A large-scale dataset for visual recognition with over 1.2 million training images across 1,000 categories.',
          url: 'http://www.image-net.org/',
          tasks: ['Image Classification', 'Object Detection'],
          languages: ['English'],
          modalities: ['Image'],
          size: '150GB',
          paper: 'ImageNet: A large-scale hierarchical image database',
          paper_title: 'ImageNet: A large-scale hierarchical image database',
          introduced_year: 2009
        },
        {
          name: 'COCO',
          full_name: 'Common Objects in Context',
          description: 'A large-scale object detection, segmentation, and captioning dataset.',
          url: 'https://cocodataset.org/',
          tasks: ['Object Detection', 'Instance Segmentation', 'Image Captioning'],
          languages: ['English'],
          modalities: ['Image'],
          size: '25GB',
          paper: 'Microsoft COCO: Common Objects in Context',
          paper_title: 'Microsoft COCO: Common Objects in Context',
          introduced_year: 2014
        },
        {
          name: 'CIFAR-10',
          full_name: 'Canadian Institute For Advanced Research 10',
          description: 'A dataset consisting of 60,000 32x32 color images in 10 different classes.',
          url: 'https://www.cs.toronto.edu/~kriz/cifar.html',
          tasks: ['Image Classification'],
          languages: ['English'],
          modalities: ['Image'],
          size: '170MB',
          paper: 'Learning Multiple Layers of Features from Tiny Images',
          paper_title: 'Learning Multiple Layers of Features from Tiny Images',
          introduced_year: 2009
        }
      ];
    }

    if (url.includes('methods')) {
      return [
        {
          name: 'Transformer',
          full_name: 'Transformer Architecture',
          description: 'A neural network architecture that relies entirely on self-attention mechanisms.',
          paper: 'Attention Is All You Need',
          paper_title: 'Attention Is All You Need',
          categories: ['Natural Language Processing', 'Machine Learning'],
          introduced_year: 2017
        },
        {
          name: 'ResNet',
          full_name: 'Residual Network',
          description: 'A deep neural network architecture that uses skip connections to ease training of very deep networks.',
          paper: 'ResNet: Deep Residual Learning for Image Recognition',
          paper_title: 'ResNet: Deep Residual Learning for Image Recognition',
          categories: ['Computer Vision', 'Deep Learning'],
          introduced_year: 2015
        },
        {
          name: 'GAN',
          full_name: 'Generative Adversarial Network',
          description: 'A class of machine learning frameworks where two neural networks contest with each other.',
          paper: 'Generative Adversarial Networks',
          paper_title: 'Generative Adversarial Networks',
          categories: ['Generative Models', 'Deep Learning'],
          introduced_year: 2014
        }
      ];
    }

    return [];
  }

  async getPapers(limit = 50, offset = 0): Promise<Paper[]> {
    const data = await this.fetchAndDecompress(DATA_URLS.papers);
    return data.slice(offset, offset + limit);
  }

  async searchPapers(query: string, limit = 20): Promise<Paper[]> {
    const data = await this.fetchAndDecompress(DATA_URLS.papers);
    const filtered = data.filter((paper: Paper) => 
      paper.title.toLowerCase().includes(query.toLowerCase()) ||
      paper.abstract.toLowerCase().includes(query.toLowerCase()) ||
      paper.authors.some(author => author.toLowerCase().includes(query.toLowerCase()))
    );
    return filtered.slice(0, limit);
  }

  async getCodeLinks(): Promise<CodeLink[]> {
    return this.fetchAndDecompress(DATA_URLS.codeLinks);
  }

  async getEvaluationTables(): Promise<EvaluationTable[]> {
    return this.fetchAndDecompress(DATA_URLS.evaluations);
  }

  async getMethods(): Promise<Method[]> {
    return this.fetchAndDecompress(DATA_URLS.methods);
  }

  async getDatasets(): Promise<Dataset[]> {
    return this.fetchAndDecompress(DATA_URLS.datasets);
  }

  async getLeaderboard(dataset: string, task: string): Promise<EvaluationTable[]> {
    const evaluations = await this.getEvaluationTables();
    return evaluations
      .filter(evaluation => evaluation.dataset === dataset && evaluation.task === task)
      .sort((a, b) => {
        // Sort by primary metric (assuming first metric is primary)
        const aMetric = Object.values(a.metrics)[0] || 0;
        const bMetric = Object.values(b.metrics)[0] || 0;
        return bMetric - aMetric;
      });
  }
}

export const api = new PapersWithCodeAPI();