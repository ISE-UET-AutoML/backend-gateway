import dataService from './dataService.js';
import logger from '../../utils/logger.js';

class DataServiceController {
  // Example of aggregation logic for dataset creation
  static async createDataset(req, res, next) {
    try {
      const { name, description, data, metadata } = req.body;
      const userId = req.user.id;

      const result = await dataService.createDataset(
        { name, description, data, metadata },
        userId,
        req.correlationId
      );

      res.status(201).json(result);
    } catch (error) {
      logger.error('Error in createDataset controller', {
        error: error.message,
        userId: req.user.id,
        correlationId: req.correlationId
      });

      if (error.message.includes('permission')) {
        return res.status(403).json({
          error: 'Forbidden',
          message: error.message
        });
      }

      next(error);
    }
  }

  // Example of aggregation logic for getting dataset
  static async getDataset(req, res, next) {
    try {
      const { datasetId } = req.params;
      const userId = req.user.id;

      const result = await dataService.getDataset(
        datasetId,
        userId,
        req.correlationId
      );

      res.json(result);
    } catch (error) {
      logger.error('Error in getDataset controller', {
        error: error.message,
        datasetId: req.params.datasetId,
        userId: req.user.id,
        correlationId: req.correlationId
      });

      if (error.response?.status === 404) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Dataset not found'
        });
      }

      next(error);
    }
  }

  // Example of data transformation
  static async transformData(req, res, next) {
    try {
      const { data, format } = req.body;
      
      const result = await dataService.transformData(
        data,
        format,
        req.correlationId
      );

      res.json(result);
    } catch (error) {
      logger.error('Error in transformData controller', {
        error: error.message,
        correlationId: req.correlationId
      });
      next(error);
    }
  }

  static async validateData(req, res, next) {
    try {
      const { data, schema } = req.body;
      
      const result = await dataService.validateData(
        data,
        schema,
        req.correlationId
      );

      res.json(result);
    } catch (error) {
      logger.error('Error in validateData controller', {
        error: error.message,
        correlationId: req.correlationId
      });
      next(error);
    }
  }
}

export default DataServiceController; 